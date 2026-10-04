import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  GameConfig, 
  LiveGame, 
  Player, 
  DrawItem, 
  BingoClaim, 
  GameStatus, 
  GameWinner,
  GameEvent,
  BingoCell,
  HallOfFameEntry
} from '../game/gameTypes';
import { generateBingoCard } from '../game/cardGenerator';
import { drawNextItem } from '../game/drawEngine';
import { validateBingoClaim } from '../game/bingoValidator';
import { appendAuditLog } from './adminService';

// Strip undefined properties recursively so Firestore setDoc/updateDoc never throws on undefined
function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => stripUndefined(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj as Record<string, any>)) {
    if (v !== undefined) {
      cleaned[k] = stripUndefined(v);
    }
  }
  return cleaned as T;
}

// Convert 2D BingoCell[][] to 1D BingoCell[] for Firestore storage (Firestore forbids nested arrays)
function serializeCardForFirestore(card: BingoCell[][]): BingoCell[] {
  if (!Array.isArray(card)) return [];
  // If already 1D, return as-is
  if (card.length > 0 && !Array.isArray(card[0])) {
    return stripUndefined(card as unknown as BingoCell[]);
  }
  const flat: BingoCell[] = [];
  card.forEach((row, r) => {
    if (Array.isArray(row)) {
      row.forEach((cell, c) => {
        flat.push(stripUndefined({
          ...cell,
          row: cell.row ?? r,
          col: cell.col ?? c,
          description: cell.description || '',
          category: cell.category || '',
        }));
      });
    }
  });
  return flat;
}

// Reconstruct 2D BingoCell[][] from Firestore 1D array or 2D array
function deserializeCardFromFirestore(rawCard: any, defaultCols: number = 5): BingoCell[][] {
  if (!rawCard) return [];
  if (Array.isArray(rawCard) && rawCard.length > 0 && Array.isArray(rawCard[0])) {
    return rawCard as BingoCell[][];
  }
  if (Array.isArray(rawCard)) {
    const cells = rawCard as BingoCell[];
    const maxRow = cells.reduce((max, c) => Math.max(max, typeof c.row === 'number' ? c.row : 0), 0);
    const rowsCount = maxRow + 1 || Math.ceil(cells.length / defaultCols) || 5;
    const grid: BingoCell[][] = Array.from({ length: rowsCount }, () => []);
    cells.forEach((cell, idx) => {
      const r = typeof cell.row === 'number' ? cell.row : Math.floor(idx / defaultCols);
      const c = typeof cell.col === 'number' ? cell.col : idx % defaultCols;
      if (!grid[r]) grid[r] = [];
      grid[r][c] = cell;
    });
    return grid;
  }
  return [];
}

function serializePlayerForFirestore(player: Player): Record<string, any> {
  return stripUndefined({
    ...player,
    card: serializeCardForFirestore(player.card),
  });
}

function deserializePlayerFromFirestore(data: any): Player {
  return {
    ...data,
    card: deserializeCardFromFirestore(data?.card),
    markedIndices: Array.isArray(data?.markedIndices) ? data.markedIndices : [],
  } as Player;
}

function serializeClaimForFirestore(claim: BingoClaim): Record<string, any> {
  return stripUndefined({
    ...claim,
    matchedCells: Array.isArray(claim.matchedCells)
      ? claim.matchedCells.map(pair => (Array.isArray(pair) ? `${pair[0]}_${pair[1]}` : String(pair)))
      : [],
  });
}

function deserializeClaimFromFirestore(data: any): BingoClaim {
  const rawCells = Array.isArray(data?.matchedCells) ? data.matchedCells : [];
  const parsedCells: [number, number][] = rawCells.map((item: any) => {
    if (Array.isArray(item) && item.length >= 2) {
      return [Number(item[0]), Number(item[1])];
    }
    if (typeof item === 'string' && item.includes('_')) {
      const [r, c] = item.split('_');
      return [parseInt(r, 10) || 0, parseInt(c, 10) || 0];
    }
    return [0, 0];
  });
  return {
    ...data,
    matchedCells: parsedCells,
  } as BingoClaim;
}

// Generate human-friendly 6-digit Game PIN
export function generateGamePin(): string {
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  return pin;
}

// 1. Host creates a new Game Room
export async function createGameRoom(
  title: string,
  config: GameConfig,
  hostId: string,
  hostEmail?: string
): Promise<LiveGame> {
  const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const pin = generateGamePin();

  // Snapshot configuration (freeze versioning)
  const configSnapshot: GameConfig = {
    ...config,
    version: (config.version || 1) + 1,
  };

  const newGame: LiveGame = {
    id: gameId,
    pin,
    title: title.trim() || config.name,
    status: 'LOBBY',
    hostId,
    hostEmail: hostEmail || '',
    configSnapshot,
    drawCount: 0,
    currentDraw: null,
    drawHistory: [],
    winners: [],
    createdAt: new Date().toISOString(),
    playerCount: 0,
  };

  try {
    await setDoc(doc(db, 'games', gameId), stripUndefined(newGame));
    await appendAuditLog({
      actorId: hostId,
      actorEmail: hostEmail || 'anonymous_host',
      action: 'GAME_CREATED',
      resource: `games/${gameId}`,
      metadata: { pin, title: newGame.title, mode: config.mode },
    });
    return newGame;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `games/${gameId}`);
  }
}

// 2. Query Game by PIN
export async function findGameByPin(pin: string): Promise<LiveGame | null> {
  try {
    const q = query(collection(db, 'games'), where('pin', '==', pin.trim()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0].data() as LiveGame;
    return docData;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'games');
  }
}

// 2b. Check if an active or lobby game is already being hosted (Single-Host Enforcement)
export async function findActiveHostedGame(): Promise<LiveGame | null> {
  try {
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'), limit(15));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      const g = d.data() as LiveGame;
      if (
        g.status === 'LOBBY' ||
        g.status === 'STARTING' ||
        g.status === 'ACTIVE' ||
        g.status === 'PAUSED' ||
        g.status === 'WIN_DETECTED'
      ) {
        return g;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// 3. Get single game doc
export async function getGame(gameId: string): Promise<LiveGame | null> {
  try {
    const docRef = doc(db, 'games', gameId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as LiveGame;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `games/${gameId}`);
  }
}

// 4. Real-time subscription to Game Room
export function subscribeToGame(
  gameId: string, 
  onUpdate: (game: LiveGame | null) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, 'games', gameId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as LiveGame);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.error('Error listening to game:', err);
    if (onError) onError(err);
  });
}

// 5. Join Game (with reconnect support & card preservation!)
export async function joinGameRoom(
  gameId: string,
  nickname: string,
  existingPlayerId?: string
): Promise<Player> {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game room not found.');

  // If player already has a session in local storage for this game, recover it!
  const storageKey = `cyber_bingo_player_${gameId}`;
  const storedId = existingPlayerId || (typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null);

  if (storedId) {
    try {
      const existingPlayerDoc = await getDoc(doc(db, 'games', gameId, 'players', storedId));
      if (existingPlayerDoc.exists()) {
        const existingData = deserializePlayerFromFirestore(existingPlayerDoc.data());
        // Mark as reconnected
        await updateDoc(doc(db, 'games', gameId, 'players', storedId), {
          connected: true,
          lastPing: new Date().toISOString(),
        });
        return existingData;
      }
    } catch {
      // Continue to create new player if recovery fails
    }
  }

  // Create new Player session
  const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const card = generateBingoCard(game.configSnapshot.board, game.configSnapshot.draw.contentType);

  // Initialize free spaces in markedIndices
  const initialMarked: string[] = [];
  card.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell.isFree) initialMarked.push(`${r}_${c}`);
    });
  });

  const newPlayer: Player = {
    id: playerId,
    gameId,
    nickname: nickname.trim() || `Player_${playerId.slice(-4)}`,
    card,
    markedIndices: initialMarked,
    score: 0,
    hasWon: false,
    connected: true,
    joinedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'games', gameId, 'players', playerId), serializePlayerForFirestore(newPlayer));
    await updateDoc(doc(db, 'games', gameId), {
      playerCount: increment(1),
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, playerId);
      localStorage.setItem(`cyber_bingo_nick_${gameId}`, newPlayer.nickname);
    }

    // Emit player joined event
    await addGameEvent(gameId, 'PLAYER_JOIN', `${newPlayer.nickname} joined the Bingo Hall.`);

    return newPlayer;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `games/${gameId}/players/${playerId}`);
  }
}

// 6. Subscriptions
export function subscribeToPlayer(
  gameId: string,
  playerId: string,
  onUpdate: (player: Player | null) => void
) {
  const docRef = doc(db, 'games', gameId, 'players', playerId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(deserializePlayerFromFirestore(snap.data()));
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('Error listening to player doc:', err);
    }
  );
}

export function subscribeToPlayers(gameId: string, onUpdate: (players: Player[]) => void) {
  const colRef = collection(db, 'games', gameId, 'players');
  return onSnapshot(colRef, (snap) => {
    const list: Player[] = [];
    snap.forEach((d) => list.push(deserializePlayerFromFirestore(d.data())));
    onUpdate(list);
  }, (err) => {
    console.error('Error listening to players:', err);
  });
}

export function subscribeToDraws(gameId: string, onUpdate: (draws: DrawItem[]) => void) {
  const colRef = collection(db, 'games', gameId, 'draws');
  const q = query(colRef, orderBy('sequence', 'asc'));
  return onSnapshot(q, (snap) => {
    const list: DrawItem[] = [];
    snap.forEach((d) => list.push(d.data() as DrawItem));
    onUpdate(list);
  }, (err) => {
    console.error('Error listening to draws:', err);
  });
}

export function subscribeToEvents(gameId: string, onUpdate: (events: GameEvent[]) => void) {
  const colRef = collection(db, 'games', gameId, 'events');
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(25));
  return onSnapshot(q, (snap) => {
    const list: GameEvent[] = [];
    snap.forEach((d) => list.push(d.data() as GameEvent));
    onUpdate(list);
  }, (err) => {
    console.error('Error listening to events:', err);
  });
}

export function subscribeToClaims(gameId: string, onUpdate: (claims: BingoClaim[]) => void) {
  const colRef = collection(db, 'games', gameId, 'claims');
  const q = query(colRef, orderBy('claimedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list: BingoClaim[] = [];
    snap.forEach((d) => list.push(deserializeClaimFromFirestore(d.data())));
    onUpdate(list);
  }, (err) => {
    console.error('Error listening to claims:', err);
  });
}

// 7. Player Marks a Cell (Awards +10 pts per valid daubed cell, + Bingo Win Bonuses)
export async function updatePlayerMarkedCells(
  gameId: string,
  playerId: string,
  markedIndices: string[],
  daubScore?: number
) {
  try {
    const payload: Record<string, any> = {
      markedIndices,
      lastPing: new Date().toISOString(),
    };
    if (typeof daubScore === 'number') {
      payload.score = daubScore;
    }
    await updateDoc(doc(db, 'games', gameId, 'players', playerId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}/players/${playerId}`);
  }
}

// 8. Player Submits a Bingo Claim & Server Validates
export async function submitBingoClaim(
  gameId: string,
  playerId: string,
  playerNickname: string,
  patternName: string,
  matchedCells: [number, number][]
): Promise<{ success: boolean; message: string; scoreAwarded?: number }> {
  const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const claimedAt = new Date().toISOString();

  // Create claim entry
  const claimDoc: BingoClaim = {
    id: claimId,
    gameId,
    playerId,
    playerNickname,
    patternName,
    matchedCells,
    status: 'PENDING',
    claimedAt,
  };

  try {
    await setDoc(doc(db, 'games', gameId, 'claims', claimId), serializeClaimForFirestore(claimDoc));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `games/${gameId}/claims/${claimId}`);
  }

  // Authoritative Validation
  try {
    const game = await getGame(gameId);
    if (!game) throw new Error('Game not found');

    const playerDoc = await getDoc(doc(db, 'games', gameId, 'players', playerId));
    if (!playerDoc.exists()) throw new Error('Player not found');
    const player = deserializePlayerFromFirestore(playerDoc.data());

    // Fetch draws
    const drawsSnap = await getDocs(query(collection(db, 'games', gameId, 'draws'), orderBy('sequence', 'asc')));
    const draws: DrawItem[] = [];
    drawsSnap.forEach(d => draws.push(d.data() as DrawItem));

    // Run validation engine
    const result = validateBingoClaim(
      player.card,
      player.markedIndices,
      draws,
      game.configSnapshot,
      game.winners || [],
      playerId
    );

    if (result.isValid && result.scoreAwarded) {
      const winnerRecord: GameWinner = {
        playerId,
        nickname: playerNickname,
        rank: result.rank || (game.winners?.length || 0) + 1,
        patternName: result.patternName || patternName,
        score: result.scoreAwarded,
        wonAt: new Date().toISOString(),
      };

      // Update claim to VERIFIED
      await updateDoc(doc(db, 'games', gameId, 'claims', claimId), {
        status: 'VERIFIED',
        verifiedAt: new Date().toISOString(),
        scoreAwarded: result.scoreAwarded,
      });

      // Update player
      await updateDoc(doc(db, 'games', gameId, 'players', playerId), {
        hasWon: true,
        score: increment(result.scoreAwarded),
        winRank: winnerRecord.rank,
      });

      // Update game winners and automatically pause the Caller Stage (or complete round if max winners reached)
      const currentWinners = game.winners || [];
      const updatedWinners = [...currentWinners, winnerRecord];
      const maxWinnersReached = !game.configSnapshot.rules.allowMultipleWinners || 
        updatedWinners.length >= game.configSnapshot.rules.maxWinners;

      await updateDoc(doc(db, 'games', gameId), {
        winners: updatedWinners,
        status: maxWinnersReached ? 'ROUND_COMPLETE' : 'PAUSED',
      });

      // Archive verified winner into Hall of Fame collection with game PIN, pattern, timestamp, and session details
      const hofId = `hof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const hofEntry: HallOfFameEntry = {
        id: hofId,
        gameId: game.id,
        gamePin: game.pin,
        gameTitle: game.title,
        gameMode: game.configSnapshot.mode || 'classic',
        roundNumber: game.roundNumber || 1,
        playerId,
        playerNickname,
        patternName: winnerRecord.patternName,
        scoreAwarded: result.scoreAwarded,
        rank: winnerRecord.rank,
        totalDrawsAtWin: draws.length,
        wonAt: winnerRecord.wonAt,
      };
      await setDoc(doc(db, 'hallOfFame', hofId), stripUndefined(hofEntry)).catch((err) => {
        console.warn('Hall of Fame write warning:', err);
      });

      // Also log verified winner in Audit Logs
      await appendAuditLog({
        actorId: playerId,
        actorEmail: playerNickname,
        action: 'HALL_OF_FAME_WINNER_VERIFIED',
        resource: `games/${gameId}`,
        metadata: {
          pin: game.pin,
          gameTitle: game.title,
          roundNumber: game.roundNumber || 1,
          playerNickname,
          patternName: winnerRecord.patternName,
          scoreAwarded: result.scoreAwarded,
          rank: winnerRecord.rank,
        },
      });

      await addGameEvent(
        gameId, 
        'BINGO_WIN', 
        `🏆 WINNER FOUND! ${playerNickname} won with ${winnerRecord.patternName} (+${result.scoreAwarded} pts)! Caller stage paused.`
      );

      return {
        success: true,
        message: `BINGO! You won ${winnerRecord.patternName} (+${result.scoreAwarded} pts)!`,
        scoreAwarded: result.scoreAwarded,
      };
    } else {
      // Reject claim
      const penalty = result.penaltyAwarded || 0;
      await updateDoc(doc(db, 'games', gameId, 'claims', claimId), {
        status: 'REJECTED',
        rejectReason: result.rejectReason || 'Validation failed.',
      });

      if (penalty > 0) {
        await updateDoc(doc(db, 'games', gameId, 'players', playerId), {
          score: increment(-penalty),
        });
      }

      await addGameEvent(
        gameId, 
        'CLAIM_REJECTED', 
        `⚠️ False Bingo claim by ${playerNickname}: ${result.rejectReason}`
      );

      return {
        success: false,
        message: result.rejectReason || 'Invalid claim. Please ensure all marked numbers have been called.',
      };
    }
  } catch (error) {
    console.error('Validation error:', error);
    return {
      success: false,
      message: 'Claim processing error. Please try again.',
    };
  }
}

// 9. Host Draws Next Item
export async function hostDrawNextItem(gameId: string): Promise<DrawItem | null> {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game not found');

  const drawsSnap = await getDocs(query(collection(db, 'games', gameId, 'draws'), orderBy('sequence', 'asc')));
  const existingDraws: DrawItem[] = [];
  drawsSnap.forEach(d => existingDraws.push(d.data() as DrawItem));

  const nextDraw = drawNextItem(gameId, game.configSnapshot.draw, existingDraws);

  if (!nextDraw) {
    // All items drawn
    await updateDoc(doc(db, 'games', gameId), {
      status: 'ROUND_COMPLETE',
    });
    await addGameEvent(gameId, 'DRAW_END', 'All 75 Bingo balls have been called!');
    return null;
  }

  const sanitizedDraw = stripUndefined({
    ...nextDraw,
    category: nextDraw.category || 'Number Draw',
    description: nextDraw.description || `Ball ${nextDraw.displayLabel}`,
  });

  try {
    await setDoc(doc(db, 'games', gameId, 'draws', sanitizedDraw.id), sanitizedDraw);
    await updateDoc(doc(db, 'games', gameId), stripUndefined({
      currentDraw: sanitizedDraw,
      drawCount: existingDraws.length + 1,
      drawHistory: [...existingDraws, sanitizedDraw],
    }));

    // Auto-daub matching cell on bot cards so bots play along in real time
    try {
      const playersSnap = await getDocs(collection(db, 'games', gameId, 'players'));
      const drawnValUpper = sanitizedDraw.value.trim().toUpperCase();
      playersSnap.forEach((pDoc) => {
        const pData = deserializePlayerFromFirestore(pDoc.data());
        if (pData.isBot) {
          const markedSet = new Set<string>(pData.markedIndices || []);
          let botChanged = false;
          pData.card.forEach((row, r) => {
            row.forEach((cell, c) => {
              if (cell.isFree || cell.value.trim().toUpperCase() === drawnValUpper) {
                const key = `${r}_${c}`;
                if (!markedSet.has(key)) {
                  markedSet.add(key);
                  botChanged = true;
                }
              }
            });
          });
          if (botChanged) {
            updateDoc(doc(db, 'games', gameId, 'players', pData.id), {
              markedIndices: Array.from(markedSet),
            }).catch(() => {});
          }
        }
      });
    } catch {
      // Non-blocking bot update
    }

    await addGameEvent(
      gameId, 
      'DRAW', 
      `🎱 [BALL #${sanitizedDraw.sequence}] ${sanitizedDraw.displayLabel}`
    );
    return sanitizedDraw;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `games/${gameId}/draws/${sanitizedDraw.id}`);
  }
}

// 10. Update Game State (Start, Pause, Resume, End)
export async function updateGameStatus(gameId: string, status: GameStatus, hostId?: string) {
  try {
    const updateData: any = { status };
    if (status === 'ACTIVE') updateData.startedAt = new Date().toISOString();
    if (status === 'FINISHED' || status === 'CANCELLED') updateData.endedAt = new Date().toISOString();

    await updateDoc(doc(db, 'games', gameId), updateData);
    await addGameEvent(gameId, 'STATUS_CHANGE', `Game status changed to: ${status}`);

    if (hostId) {
      await appendAuditLog({
        actorId: hostId,
        actorEmail: 'host',
        action: `GAME_${status}`,
        resource: `games/${gameId}`,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
  }
}

// 11. Add Real-time Event
export async function addGameEvent(gameId: string, type: string, message: string) {
  const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  try {
    await setDoc(doc(db, 'games', gameId, 'events', eventId), {
      id: eventId,
      gameId,
      type,
      message,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Non-fatal event write
  }
}

// 12. Play Again — Archive Final Scores to Audit Logs, Reset Board & Clear All Player Daubs while retaining Room Settings & Players
export async function resetGameRoundForPlayAgain(
  gameId: string,
  hostId?: string,
  hostEmail?: string
): Promise<void> {
  const game = await getGame(gameId);
  if (!game) throw new Error('Game room not found.');

  const currentRound = game.roundNumber || 1;
  const nextRound = currentRound + 1;

  try {
    // 1. Fetch all players to archive their final round scores before resetting
    const playersSnap = await getDocs(collection(db, 'games', gameId, 'players'));
    const finalStandings: Array<{
      playerId: string;
      nickname: string;
      finalScore: number;
      hasWon: boolean;
      winRank?: number;
    }> = [];

    const playerDocs: Player[] = [];
    playersSnap.forEach((pDoc) => {
      const p = deserializePlayerFromFirestore(pDoc.data());
      playerDocs.push(p);
      finalStandings.push({
        playerId: p.id,
        nickname: p.nickname,
        finalScore: p.score || 0,
        hasWon: Boolean(p.hasWon),
        winRank: p.winRank,
      });
    });

    // Sort standings highest score first
    finalStandings.sort((a, b) => b.finalScore - a.finalScore);

    // 2. Confirm all final scores & winners are archived in Audit Logs before starting the new round
    await appendAuditLog({
      actorId: hostId || game.hostId,
      actorEmail: hostEmail || game.hostEmail || 'host',
      action: 'ROUND_SCORES_ARCHIVED_AND_PLAY_AGAIN',
      resource: `games/${gameId}`,
      metadata: {
        pin: game.pin,
        gameTitle: game.title,
        completedRound: currentRound,
        nextRound,
        totalDraws: game.drawCount || 0,
        winners: game.winners || [],
        finalPlayerScores: finalStandings,
      },
    });

    // 3. Clear all previous draws in subcollection
    const drawsSnap = await getDocs(collection(db, 'games', gameId, 'draws'));
    for (const d of drawsSnap.docs) {
      await deleteDoc(doc(db, 'games', gameId, 'draws', d.id)).catch(() => {});
    }

    // 4. Clear all previous claims in subcollection
    const claimsSnap = await getDocs(collection(db, 'games', gameId, 'claims'));
    for (const c of claimsSnap.docs) {
      await deleteDoc(doc(db, 'games', gameId, 'claims', c.id)).catch(() => {});
    }

    // 5. Clear all player daubs (keeping only FREE space marked) while retaining current player list
    for (const p of playerDocs) {
      const freeOnlyMarked: string[] = [];
      p.card.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell.isFree) {
            freeOnlyMarked.push(`${r}_${c}`);
          }
        });
      });

      await updateDoc(doc(db, 'games', gameId, 'players', p.id), {
        markedIndices: freeOnlyMarked,
        score: 0,
        hasWon: false,
        winRank: 0,
        lastPing: new Date().toISOString(),
      }).catch(() => {});
    }

    // 6. Reset game document for the new round while keeping PIN, title, configSnapshot, and playerCount
    await updateDoc(doc(db, 'games', gameId), {
      status: 'ACTIVE',
      roundNumber: nextRound,
      drawCount: 0,
      currentDraw: null,
      drawHistory: [],
      winners: [],
      startedAt: new Date().toISOString(),
    });

    await addGameEvent(
      gameId,
      'ROUND_RESET',
      `🔄 Round ${nextRound} started! Final scores from Round ${currentRound} archived to Audit Logs and all player daubs cleared.`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${gameId}`);
  }
}

