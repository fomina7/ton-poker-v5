/**
 * Tournament Manager — handles tournament lifecycle
 * Supports Sit & Go and MTT tournaments with blind progression
 */
import { Server as SocketServer } from "socket.io";
import {
  GameState,
  PlayerState,
  createNewHand,
  processAction,
  getBotAction,
  RakeConfig,
} from "./pokerEngine";
import { getDb } from "./db";
import { tournaments, tournamentEntries, users, botConfigs } from "../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";

interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  duration: number; // minutes
}

interface TournamentRoom {
  tournamentId: number;
  state: GameState;
  blindLevels: BlindLevel[];
  currentLevel: number;
  levelStartTime: number;
  blindTimer?: NodeJS.Timeout;
  actionTimer?: NodeJS.Timeout;
  botTimers: Map<number, NodeJS.Timeout>;
}

class TournamentManager {
  private io: SocketServer | null = null;
  private tournaments: Map<number, TournamentRoom> = new Map();
  private registrationTimers: Map<number, NodeJS.Timeout> = new Map();

  init(io: SocketServer) {
    this.io = io;
    this.checkPendingTournaments();
  }

  /**
   * Check for tournaments that should start
   */
  private async checkPendingTournaments() {
    const db = await getDb();
    if (!db) return;

    const pending = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.status, "registering"));

    for (const t of pending) {
      // Check if minimum players reached
      if (t.currentPlayers >= t.minPlayers) {
        // Auto-start if scheduled time passed or it's a Sit & Go
        if (t.type === "sit_and_go" || (t.scheduledStart && new Date(t.scheduledStart) <= new Date())) {
          await this.startTournament(t.id);
        }
      }
    }

    // Check again in 10 seconds
    setTimeout(() => this.checkPendingTournaments(), 10000);
  }

  /**
   * Register a player for a tournament
   */
  async registerPlayer(tournamentId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    const db = await getDb();
    if (!db) return { success: false, message: "Database error" };

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) return { success: false, message: "Tournament not found" };
    if (tournament.status !== "registering") return { success: false, message: "Registration closed" };
    if (tournament.currentPlayers >= tournament.maxPlayers) return { success: false, message: "Tournament full" };

    // Check if already registered
    const existing = await db
      .select()
      .from(tournamentEntries)
      .where(and(eq(tournamentEntries.tournamentId, tournamentId), eq(tournamentEntries.userId, userId)));
    if (existing.length > 0) return { success: false, message: "Already registered" };

    // Check balance
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return { success: false, message: "User not found" };
    
    const totalCost = tournament.buyIn + tournament.entryFee;
    if (tournament.buyIn > 0) {
      if (user.balanceReal < totalCost) {
        return { success: false, message: `Insufficient balance. Need ${totalCost}` };
      }
      // Deduct buy-in
      await db.update(users).set({ balanceReal: sql`balanceReal - ${totalCost}` }).where(eq(users.id, userId));
    }

    // Register
    await db.insert(tournamentEntries).values({
      tournamentId,
      userId,
      isBot: false,
      chipStack: tournament.startingChips,
      status: "registered",
    });

    // Update tournament
    await db
      .update(tournaments)
      .set({
        currentPlayers: sql`currentPlayers + 1`,
        prizePool: sql`prizePool + ${tournament.buyIn}`,
      })
      .where(eq(tournaments.id, tournamentId));

    // Check if we should start (Sit & Go)
    const [updated] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (updated.type === "sit_and_go" && updated.currentPlayers >= updated.minPlayers) {
      // Start in 10 seconds
      setTimeout(() => this.startTournament(tournamentId), 10000);
    }

    return { success: true };
  }

  /**
   * Unregister a player from a tournament
   */
  async unregisterPlayer(tournamentId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    const db = await getDb();
    if (!db) return { success: false, message: "Database error" };

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) return { success: false, message: "Tournament not found" };
    if (tournament.status !== "registering") return { success: false, message: "Cannot unregister after start" };

    const [entry] = await db
      .select()
      .from(tournamentEntries)
      .where(and(eq(tournamentEntries.tournamentId, tournamentId), eq(tournamentEntries.userId, userId)));
    if (!entry) return { success: false, message: "Not registered" };

    // Refund
    const totalCost = tournament.buyIn + tournament.entryFee;
    if (tournament.buyIn > 0) {
      await db.update(users).set({ balanceReal: sql`balanceReal + ${totalCost}` }).where(eq(users.id, userId));
    }

    // Remove entry
    await db.delete(tournamentEntries).where(eq(tournamentEntries.id, entry.id));

    // Update tournament
    await db
      .update(tournaments)
      .set({
        currentPlayers: sql`currentPlayers - 1`,
        prizePool: sql`prizePool - ${tournament.buyIn}`,
      })
      .where(eq(tournaments.id, tournamentId));

    return { success: true };
  }

  /**
   * Start a tournament
   */
  private async startTournament(tournamentId: number) {
    const db = await getDb();
    if (!db) return;

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament || tournament.status !== "registering") return;

    // Add bots if enabled
    if (tournament.botsEnabled && tournament.currentPlayers < tournament.maxPlayers) {
      await this.addBotsToTournament(tournamentId, tournament.botCount);
    }

    // Mark as running
    await db
      .update(tournaments)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(tournaments.id, tournamentId));

    // Create game state
    const entries = await db.select().from(tournamentEntries).where(eq(tournamentEntries.tournamentId, tournamentId));
    
    const blindStructure = tournament.blindStructure as BlindLevel[];
    const firstLevel = blindStructure[0];

    const rakeConfig: RakeConfig = {
      percentage: 0, // No rake in tournaments
      cap: 0,
      minPotForRake: 999999,
    };

    const players: PlayerState[] = entries.map((entry, idx) => ({
      seatIndex: idx,
      oddsUserId: entry.userId || null,
      name: entry.isBot ? (entry.botName || "Bot") : `Player ${entry.userId}`,
      avatar: entry.isBot ? (entry.botAvatar || "bot") : "player",
      chipStack: tournament.startingChips,
      currentBet: 0,
      totalBetThisHand: 0,
      holeCards: [],
      folded: false,
      allIn: false,
      isBot: entry.isBot,
      botDifficulty: entry.botDifficulty || "medium",
      lastAction: undefined,
      disconnected: false,
      sittingOut: false,
      hasActedThisRound: false,
    }));

    const state: GameState = {
      tableId: tournamentId,
      gameType: "holdem",
      phase: "waiting",
      communityCards: [],
      deck: [],
      players,
      pots: [],
      currentBet: 0,
      minRaise: firstLevel.bigBlind,
      dealerSeat: 0,
      smallBlindSeat: 0,
      bigBlindSeat: 0,
      actionSeat: -1,
      smallBlind: firstLevel.smallBlind,
      bigBlind: firstLevel.bigBlind,
      handNumber: 0,
      actionDeadline: 0,
      lastRaiserSeat: -1,
      raisesThisStreet: 0,
      rake: rakeConfig,
      rakeCollected: 0,
      totalPotBeforeRake: 0,
    };

    const room: TournamentRoom = {
      tournamentId,
      state,
      blindLevels: blindStructure,
      currentLevel: 0,
      levelStartTime: Date.now(),
      botTimers: new Map(),
    };

    this.tournaments.set(tournamentId, room);

    // Start first hand
    this.startNewHand(tournamentId);

    // Schedule blind increase
    this.scheduleBlindIncrease(tournamentId);

    // Broadcast to clients
    this.io?.to(`tournament_${tournamentId}`).emit("tournament_started", { tournamentId });
  }

  /**
   * Add bots to tournament
   */
  private async addBotsToTournament(tournamentId: number, count: number) {
    const db = await getDb();
    if (!db) return;

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) return;

    const availableSlots = tournament.maxPlayers - tournament.currentPlayers;
    const botsToAdd = Math.min(count, availableSlots);

    const allBots = await db.select().from(botConfigs).where(eq(botConfigs.isActive, true));
    
    for (let i = 0; i < botsToAdd; i++) {
      const bot = allBots[i % allBots.length];
      await db.insert(tournamentEntries).values({
        tournamentId,
        userId: null,
        isBot: true,
        botName: bot.name,
        botAvatar: bot.avatar,
        botDifficulty: bot.difficulty,
        chipStack: tournament.startingChips,
        status: "registered",
      });
    }

    await db
      .update(tournaments)
      .set({ currentPlayers: sql`currentPlayers + ${botsToAdd}` })
      .where(eq(tournaments.id, tournamentId));
  }

  /**
   * Start a new hand in tournament
   */
  private startNewHand(tournamentId: number) {
    const room = this.tournaments.get(tournamentId);
    if (!room) return;

    // Check for eliminations
    this.checkEliminations(tournamentId);

    // Check if tournament is over
    const activePlayers = room.state.players.filter(p => p.chipStack > 0);
    if (activePlayers.length <= 1) {
      this.endTournament(tournamentId);
      return;
    }

    room.state = createNewHand(room.state);
    this.broadcastState(tournamentId);

    // Schedule bot actions
    this.scheduleBotAction(tournamentId);
  }

  /**
   * Check for player eliminations
   */
  private async checkEliminations(tournamentId: number) {
    const room = this.tournaments.get(tournamentId);
    if (!room) return;

    const db = await getDb();
    if (!db) return;

    for (const player of room.state.players) {
      if (player.chipStack <= 0 && !player.folded) {
        // Mark as eliminated
        if (player.oddsUserId) {
          await db
            .update(tournamentEntries)
            .set({
              status: "eliminated",
              eliminatedAt: new Date(),
            })
            .where(
              and(
                eq(tournamentEntries.tournamentId, tournamentId),
                eq(tournamentEntries.userId, player.oddsUserId)
              )
            );
        }
        player.folded = true;
        player.sittingOut = true;
      }
    }
  }

  /**
   * Schedule blind level increase
   */
  private scheduleBlindIncrease(tournamentId: number) {
    const room = this.tournaments.get(tournamentId);
    if (!room) return;

    const currentLevel = room.blindLevels[room.currentLevel];
    const duration = currentLevel.duration * 60 * 1000; // convert to ms

    room.blindTimer = setTimeout(() => {
      this.increaseBlindLevel(tournamentId);
    }, duration);
  }

  /**
   * Increase blind level
   */
  private increaseBlindLevel(tournamentId: number) {
    const room = this.tournaments.get(tournamentId);
    if (!room) return;

    room.currentLevel++;
    if (room.currentLevel >= room.blindLevels.length) {
      room.currentLevel = room.blindLevels.length - 1; // Stay at max level
    }

    const newLevel = room.blindLevels[room.currentLevel];
    room.state.smallBlind = newLevel.smallBlind;
    room.state.bigBlind = newLevel.bigBlind;
    room.state.minRaise = newLevel.bigBlind;
    room.levelStartTime = Date.now();

    this.broadcastState(tournamentId);
    this.io?.to(`tournament_${tournamentId}`).emit("blind_level_increased", {
      level: newLevel.level,
      smallBlind: newLevel.smallBlind,
      bigBlind: newLevel.bigBlind,
    });

    // Schedule next increase
    this.scheduleBlindIncrease(tournamentId);
  }

  /**
   * Schedule bot action
   */
  private scheduleBotAction(tournamentId: number) {
    const room = this.tournaments.get(tournamentId);
    if (!room || room.state.phase === "waiting" || room.state.phase === "showdown") return;

    const currentPlayer = room.state.players.find(p => p.seatIndex === room.state.actionSeat);
    if (!currentPlayer || !currentPlayer.isBot) return;

    const delay = 1000 + Math.random() * 2000; // 1-3 seconds
    const timer = setTimeout(() => {
      const botAction = getBotAction(room.state, currentPlayer);
      room.state = processAction(room.state, currentPlayer.seatIndex, botAction.action, botAction.amount);
      this.broadcastState(tournamentId);

      if (room.state.phase === "showdown") {
        setTimeout(() => this.startNewHand(tournamentId), 5000);
      } else {
        this.scheduleBotAction(tournamentId);
      }
    }, delay);

    room.botTimers.set(currentPlayer.seatIndex, timer);
  }

  /**
   * End tournament and distribute prizes
   */
  private async endTournament(tournamentId: number) {
    const db = await getDb();
    if (!db) return;

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) return;

    await db
      .update(tournaments)
      .set({
        status: "completed",
        endedAt: new Date(),
      })
      .where(eq(tournaments.id, tournamentId));

    // Distribute prizes based on payout structure
    await this.distributePrizes(tournamentId);

    // Clean up
    const room = this.tournaments.get(tournamentId);
    if (room) {
      if (room.blindTimer) clearTimeout(room.blindTimer);
      if (room.actionTimer) clearTimeout(room.actionTimer);
      room.botTimers.forEach(t => clearTimeout(t));
      this.tournaments.delete(tournamentId);
    }

    this.io?.to(`tournament_${tournamentId}`).emit("tournament_ended", { tournamentId });
  }

  /**
   * Distribute prizes to winners
   */
  private async distributePrizes(tournamentId: number) {
    const db = await getDb();
    if (!db) return;

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) return;

    const entries = await db
      .select()
      .from(tournamentEntries)
      .where(eq(tournamentEntries.tournamentId, tournamentId));

    // Sort by chip stack (or elimination order)
    const sorted = entries.sort((a, b) => {
      if (a.status === "eliminated" && b.status === "eliminated") {
        return (b.eliminatedAt?.getTime() || 0) - (a.eliminatedAt?.getTime() || 0);
      }
      return b.chipStack - a.chipStack;
    });

    // Assign positions
    for (let i = 0; i < sorted.length; i++) {
      await db
        .update(tournamentEntries)
        .set({ finishPosition: i + 1 })
        .where(eq(tournamentEntries.id, sorted[i].id));
    }

    // Calculate payouts
    const payoutStructure = (tournament.payoutStructure as any[]) || [
      { place: 1, percentage: 50 },
      { place: 2, percentage: 30 },
      { place: 3, percentage: 20 },
    ];

    for (const payout of payoutStructure) {
      if (payout.place <= sorted.length) {
        const entry = sorted[payout.place - 1];
        const prize = Math.floor((tournament.prizePool * payout.percentage) / 100);
        
        if (entry.userId && prize > 0) {
          await db.update(users).set({ balanceReal: sql`balanceReal + ${prize}` }).where(eq(users.id, entry.userId));
          await db.update(tournamentEntries).set({ prizeWon: prize }).where(eq(tournamentEntries.id, entry.id));
        }
      }
    }
  }

  /**
   * Broadcast tournament state
   */
  private broadcastState(tournamentId: number) {
    const room = this.tournaments.get(tournamentId);
    if (!room || !this.io) return;

    // Broadcast to all players in tournament
    this.io.to(`tournament_${tournamentId}`).emit("tournament_state", {
      state: room.state,
      currentLevel: room.currentLevel,
      blindLevel: room.blindLevels[room.currentLevel],
    });
  }

  /**
   * Get tournament info
   */
  async getTournamentInfo(tournamentId: number) {
    const db = await getDb();
    if (!db) return null;

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) return null;

    const entries = await db.select().from(tournamentEntries).where(eq(tournamentEntries.tournamentId, tournamentId));

    return {
      ...tournament,
      entries,
    };
  }
}

export const tournamentManager = new TournamentManager();
