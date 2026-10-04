import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Wifi, 
  Trophy, 
  AlertTriangle, 
  CheckCircle,
  Star,
  Palette,
  Wand2
} from 'lucide-react';
import { 
  subscribeToGame, 
  subscribeToPlayer,
  joinGameRoom, 
  updatePlayerMarkedCells, 
  submitBingoClaim,
  subscribeToDraws,
  subscribeToClaims
} from '../services/gameService';
import { LiveGame, Player, DrawItem, BingoCell, BingoClaim } from '../game/gameTypes';
import { evaluateBingoPatterns, toMarkedKey } from '../game/patternEngine';
import { SYSTEM_PATTERNS } from '../game/seedData';
import { WinnerModal } from '../components/WinnerModal';
import { ClassicBingoBall } from '../components/ClassicBingoBall';
import { sound } from '../game/soundEngine';
import { purgeExpiredPlayerNickname, savePlayerNicknameWithTtl } from '../utils/playerSession';

type DauberColorId = 'red' | 'blue' | 'emerald' | 'purple' | 'pink' | 'amber';

interface DauberTheme {
  id: DauberColorId;
  name: string;
  swatch: string;
  stampBg: string;
  stampBorder: string;
}

const DAUBER_COLORS: DauberTheme[] = [
  { id: 'red', name: 'Crimson Ink', swatch: 'bg-red-500', stampBg: 'bg-red-500/80', stampBorder: 'border-red-300/80 shadow-red-500/40' },
  { id: 'blue', name: 'Royal Ink', swatch: 'bg-blue-500', stampBg: 'bg-blue-500/80', stampBorder: 'border-blue-300/80 shadow-blue-500/40' },
  { id: 'emerald', name: 'Lucky Green', swatch: 'bg-emerald-500', stampBg: 'bg-emerald-500/80', stampBorder: 'border-emerald-300/80 shadow-emerald-500/40' },
  { id: 'purple', name: 'Violet Ink', swatch: 'bg-purple-500', stampBg: 'bg-purple-500/80', stampBorder: 'border-purple-300/80 shadow-purple-500/40' },
  { id: 'pink', name: 'Hot Pink', swatch: 'bg-pink-500', stampBg: 'bg-pink-500/80', stampBorder: 'border-pink-300/80 shadow-pink-500/40' },
  { id: 'amber', name: 'Gold Dauber', swatch: 'bg-amber-500', stampBg: 'bg-amber-500/85', stampBorder: 'border-amber-200/80 shadow-amber-500/40' },
];

export const PlayerGamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<LiveGame | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [draws, setDraws] = useState<DrawItem[]>([]);
  const [claims, setClaims] = useState<BingoClaim[]>([]);
  const [markedKeys, setMarkedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Classic Bingo Dauber & Assist Controls
  const [dauberColor, setDauberColor] = useState<DauberColorId>('red');
  const [autoDaub, setAutoDaub] = useState<boolean>(false);
  const [highlightCalled, setHighlightCalled] = useState<boolean>(true);
  const lastAnnouncedDrawIdRef = useRef<string | null>(null);

  const [winnerModalData, setWinnerModalData] = useState<{
    isOpen: boolean;
    nickname: string;
    pattern: string;
    score: number;
    rank: number;
    isSelf: boolean;
  }>({
    isOpen: false,
    nickname: '',
    pattern: '',
    score: 0,
    rank: 1,
    isSelf: false,
  });

  // 1. Join / Reconnect Game Session
  useEffect(() => {
    if (!gameId) return;

    let unsubGame: (() => void) | null = null;
    let unsubPlayer: (() => void) | null = null;
    let unsubDraws: (() => void) | null = null;
    let unsubClaims: (() => void) | null = null;

    const init = async () => {
      try {
        setLoading(true);
        const storedNick =
          localStorage.getItem(`cyber_bingo_nick_${gameId}`) ||
          purgeExpiredPlayerNickname() ||
          'Player 1';
        savePlayerNicknameWithTtl(storedNick);

        const p = await joinGameRoom(gameId, storedNick);
        setPlayer(p);

        // Subscribe to real-time updates on this player's document (score, rank, hasWon, and Play Again daub reset)
        unsubPlayer = subscribeToPlayer(gameId, p.id, (updatedPlayer) => {
          if (updatedPlayer) {
            setPlayer(updatedPlayer);
            // Sync markedKeys when Host resets daubs on Play Again
            const syncedMarks = new Set<string>(updatedPlayer.markedIndices || []);
            updatedPlayer.card.forEach((row, r) =>
              row.forEach((cell, c) => {
                if (cell.isFree) syncedMarks.add(toMarkedKey(r, c));
              })
            );
            setMarkedKeys(syncedMarks);
          }
        });

        // Ensure free space is marked by default
        const initialMarks = new Set<string>(p.markedIndices || []);
        p.card.forEach((row, r) =>
          row.forEach((cell, c) => {
            if (cell.isFree) initialMarks.add(toMarkedKey(r, c));
          })
        );
        setMarkedKeys(initialMarks);

        // Subscriptions
        unsubGame = subscribeToGame(gameId, (g) => {
          if (!g) {
            setError('This Bingo Hall session has ended.');
          } else {
            setGame(g);
            // If Host triggered Play Again (drawCount === 0 and winners emptied), seamlessly close winner modal & clear feedback
            if (g.drawCount === 0 && (!g.winners || g.winners.length === 0)) {
              lastAnnouncedDrawIdRef.current = null;
              setClaimFeedback(null);
              setWinnerModalData((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
            }
          }
        });

        unsubDraws = subscribeToDraws(gameId, (drawList) => {
          setDraws(drawList);
        });

        unsubClaims = subscribeToClaims(gameId, (claimList) => {
          setClaims(claimList);
          const verifiedClaims = claimList.filter(c => c.status === 'VERIFIED');
          if (verifiedClaims.length > 0) {
            const latest = verifiedClaims[0];
            setWinnerModalData((prev) => {
              if (prev.isOpen && prev.nickname === latest.playerNickname) return prev;
              return {
                isOpen: true,
                nickname: latest.playerNickname,
                pattern: latest.patternName,
                score: latest.scoreAwarded || 100,
                rank: 1,
                isSelf: Boolean(p && latest.playerId === p.id),
              };
            });
          }
        });

        setLoading(false);
      } catch (err: any) {
        console.error('Failed to initialize player session:', err);
        setError(err.message || 'Failed to connect to the Bingo room.');
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubGame) unsubGame();
      if (unsubPlayer) unsubPlayer();
      if (unsubDraws) unsubDraws();
      if (unsubClaims) unsubClaims();
    };
  }, [gameId]);

  // Set of officially drawn uppercase values
  const drawnValuesSet = useMemo(() => {
    const s = new Set<string>();
    draws.forEach(d => s.add(d.value.trim().toUpperCase()));
    return s;
  }, [draws]);

  // Helper to compute live score based on valid daubed squares (+10 pts each) + any claimed Bingo bonus
  const computeNextScore = (nextMarked: Set<string>, currentPlayer: Player, currentGame: LiveGame): number => {
    let validDaubCount = 0;
    currentPlayer.card.forEach((row, r) => {
      row.forEach((cell, c) => {
        const k = toMarkedKey(r, c);
        if (!cell.isFree && nextMarked.has(k) && drawnValuesSet.has(cell.value.trim().toUpperCase())) {
          validDaubCount++;
        }
      });
    });
    const daubPoints = validDaubCount * 10;
    const winBonus = (currentGame.winners || [])
      .filter((w) => w.playerId === currentPlayer.id)
      .reduce((sum, w) => sum + (w.score || 0), 0);
    return daubPoints + winBonus;
  };

  // Sound + Voice Callout on new draw + Auto-Daub if enabled
  useEffect(() => {
    if (draws.length === 0) return;
    const latest = draws[draws.length - 1];
    if (latest && latest.id !== lastAnnouncedDrawIdRef.current) {
      lastAnnouncedDrawIdRef.current = latest.id;
      sound.playBallRoll();
      sound.announceBall(latest.displayLabel);
    }

    // Auto-Daub matching cells if enabled
    if (autoDaub && player && game) {
      const nextMarked = new Set(markedKeys);
      let changed = false;
      player.card.forEach((row, r) => {
        row.forEach((cell, c) => {
          const key = toMarkedKey(r, c);
          if (cell.isFree || drawnValuesSet.has(cell.value.trim().toUpperCase())) {
            if (!nextMarked.has(key)) {
              nextMarked.add(key);
              changed = true;
            }
          }
        });
      });

      if (changed) {
        const nextScore = computeNextScore(nextMarked, player, game);
        setMarkedKeys(nextMarked);
        setPlayer((prev) => (prev ? { ...prev, score: nextScore } : prev));
        updatePlayerMarkedCells(game.id, player.id, Array.from(nextMarked), nextScore);
      }
    }
  }, [draws, autoDaub, player, game, drawnValuesSet]);

  // Check if player currently satisfies any active winning pattern
  const currentWinningCheck = useMemo(() => {
    if (!player || !game) return { hasWon: false, patternName: '', matchedCells: [] };
    const allPatterns = [...SYSTEM_PATTERNS, ...(game.configSnapshot.customPatterns || [])];
    return evaluateBingoPatterns(
      player.card,
      new Set(markedKeys),
      game.configSnapshot.winningPatterns,
      allPatterns
    );
  }, [player, game, markedKeys]);

  // Set of winning pattern coordinates for visual highlight
  const winningCellsSet = useMemo(() => {
    const s = new Set<string>();
    if (currentWinningCheck.hasWon) {
      currentWinningCheck.matchedCells.forEach(([r, c]) => s.add(toMarkedKey(r, c)));
    }
    return s;
  }, [currentWinningCheck]);

  // Handle cell click (Daub / Undaub)
  const handleCellClick = async (cell: BingoCell) => {
    if (!game || !player) return;
    if (game.status !== 'ACTIVE' && game.status !== 'WIN_DETECTED') {
      return;
    }

    const key = toMarkedKey(cell.row, cell.col);
    const isCurrentlyMarked = markedKeys.has(key);

    if (cell.isFree) {
      sound.playDaub();
      return;
    }

    // Verify that the number has actually been called!
    const cellValueUpper = cell.value.trim().toUpperCase();
    const isDrawn = drawnValuesSet.has(cellValueUpper);

    if (!isDrawn && !isCurrentlyMarked) {
      sound.playError();
      setClaimFeedback({
        type: 'error',
        message: `Hold your dauber! Ball "${cell.displayLabel}" hasn't been called yet!`,
      });
      setTimeout(() => setClaimFeedback(null), 2800);
      return;
    }

    // Stamp Dauber
    sound.playDaub();
    const nextMarked = new Set(markedKeys);
    if (isCurrentlyMarked) {
      nextMarked.delete(key);
    } else {
      nextMarked.add(key);
    }

    const nextScore = computeNextScore(nextMarked, player, game);
    setMarkedKeys(nextMarked);
    setPlayer((prev) => (prev ? { ...prev, score: nextScore } : prev));
    await updatePlayerMarkedCells(game.id, player.id, Array.from(nextMarked), nextScore);
  };

  // Submit Bingo Claim
  const handleClaimBingo = async () => {
    if (!game || !player || claimLoading) return;
    if (!currentWinningCheck.hasWon) {
      sound.playError();
      const penalty = game.configSnapshot.scoring.falseClaimPenalty || 25;
      const penalizedScore = Math.max(0, (player.score || 0) - penalty);
      setPlayer((prev) => (prev ? { ...prev, score: penalizedScore } : prev));
      await updatePlayerMarkedCells(game.id, player.id, Array.from(markedKeys), penalizedScore);
      setClaimFeedback({
        type: 'error',
        message: `False Bingo claim! -${penalty} PTS penalty applied. Complete a winning pattern first.`,
      });
      setTimeout(() => setClaimFeedback(null), 3500);
      return;
    }

    setClaimLoading(true);
    sound.playClick();

    try {
      const res = await submitBingoClaim(
        game.id,
        player.id,
        player.nickname,
        currentWinningCheck.patternName,
        currentWinningCheck.matchedCells
      );

      if (res.success) {
        const awarded = res.scoreAwarded || 100;
        setPlayer((prev) => (prev ? { ...prev, score: (prev.score || 0) + awarded, hasWon: true } : prev));
        setWinnerModalData({
          isOpen: true,
          nickname: player.nickname,
          pattern: currentWinningCheck.patternName,
          score: awarded,
          rank: (game.winners?.length || 0) + 1,
          isSelf: true,
        });
        setClaimFeedback({
          type: 'success',
          message: res.message,
        });
      } else {
        sound.playError();
        setClaimFeedback({
          type: 'error',
          message: res.message,
        });
      }
    } catch (err: any) {
      sound.playError();
      setClaimFeedback({
        type: 'error',
        message: 'Bingo claim failed to verify. Please try again.',
      });
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-[#0b0e1a] text-center">
        <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-black text-xl text-amber-300 tracking-wider">
          SETTING UP YOUR BINGO CARD...
        </div>
        <div className="text-xs text-slate-400 mt-2">
          Preparing fresh daubers and connecting to the Caller Stage
        </div>
      </div>
    );
  }

  if (error || !game || !player) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-[#0b0e1a] text-center">
        <div className="bg-slate-900 border border-red-500/40 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-red-300 mb-2">HALL SESSION ENDED</h2>
          <p className="text-slate-400 text-sm mb-6">{error || 'Game room could not be loaded.'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-sm tracking-wider cursor-pointer"
          >
            BACK TO BINGO LOBBY
          </button>
        </div>
      </div>
    );
  }

  const latestDraw = draws[draws.length - 1];
  const activeDauber = DAUBER_COLORS.find(d => d.id === dauberColor) || DAUBER_COLORS[0];

  const columnHeaders = [
    { letter: 'B', bg: 'bg-gradient-to-b from-red-500 to-red-700', border: 'border-red-400/50', range: '1-15' },
    { letter: 'I', bg: 'bg-gradient-to-b from-amber-400 to-amber-600', border: 'border-amber-300/50', range: '16-30' },
    { letter: 'N', bg: 'bg-gradient-to-b from-blue-500 to-blue-700', border: 'border-blue-400/50', range: '31-45' },
    { letter: 'G', bg: 'bg-gradient-to-b from-emerald-500 to-emerald-700', border: 'border-emerald-400/50', range: '46-60' },
    { letter: 'O', bg: 'bg-gradient-to-b from-purple-500 to-purple-700', border: 'border-purple-400/50', range: '61-75' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-2 sm:p-5 lg:p-6 pb-24 lg:pb-6 bg-gradient-to-b from-[#0b0e1a] via-[#11172b] to-[#090c16] flex flex-col max-w-6xl mx-auto">
      
      {/* Top Hall Status Bar — Compact on Mobile */}
      <div className="bg-[#12182d]/95 border border-amber-500/30 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 mb-2.5 sm:mb-4 backdrop-blur-md flex items-center justify-between gap-2 shadow-xl">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono font-black text-[11px] sm:text-sm shrink-0">
            PIN: {game.pin}
          </div>
          <div className="min-w-0">
            <div className="font-black text-xs sm:text-base text-white tracking-wide truncate">
              {game.title}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 truncate">
              <span className="truncate">Player: <b className="text-amber-300">{player.nickname}</b></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0">
                <Wifi className="w-3 h-3" /> Live
              </span>
            </div>
          </div>
        </div>

        {/* Player Score & Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900 border border-amber-500/40 text-right shadow-inner"
            title="+10 PTS per daubed number | +100 Base Win + Rank Bonus on BINGO! | -25 PTS on False Claim"
          >
            <div className="text-[8px] sm:text-[9px] font-bold text-amber-300/80 uppercase tracking-wider">
              SCORE (+10/DAUB)
            </div>
            <div className="font-mono font-black text-xs sm:text-sm text-amber-400">
              {player.score || 0} PTS
            </div>
          </div>
        </div>
      </div>

      {/* Live Caller Display & Recent Balls Tray — Streamlined on Mobile */}
      <div className="bg-gradient-to-r from-[#131b36] via-[#192347] to-[#131b36] border-2 border-amber-500/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 mb-2.5 sm:mb-4 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
        {/* Current Drawn Ball */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <div className="shrink-0">
            {latestDraw ? (
              <>
                <div className="sm:hidden">
                  <ClassicBingoBall
                    value={latestDraw.value}
                    label={latestDraw.displayLabel}
                    size="md"
                    animated={true}
                  />
                </div>
                <div className="hidden sm:block">
                  <ClassicBingoBall
                    value={latestDraw.value}
                    label={latestDraw.displayLabel}
                    size="lg"
                    animated={true}
                  />
                </div>
              </>
            ) : (
              <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-slate-900 border-2 border-dashed border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-[10px] sm:text-xs text-center p-1">
                READY
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold text-amber-300 tracking-wider uppercase flex items-center gap-1.5">
              <span>BALL #{draws.length} OF 75</span>
            </div>
            <div className="font-black text-lg sm:text-4xl text-white tracking-tight mt-0.5 truncate">
              {latestDraw ? latestDraw.displayLabel : 'Waiting for Host Caller...'}
            </div>
          </div>
        </div>

        {/* Last 5 Called Balls — Horizontal Scrollable Strip on Mobile */}
        {draws.length > 1 && (
          <div className="w-full sm:w-auto flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl overflow-x-auto">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mr-1 shrink-0">PREV:</span>
            {draws.slice(-6, -1).reverse().map((d) => (
              <div key={d.id} className="shrink-0">
                <ClassicBingoBall value={d.value} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {claimFeedback && (
        <div className={`p-2.5 sm:p-3.5 rounded-xl mb-2.5 sm:mb-4 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg ${
          claimFeedback.type === 'success'
            ? 'bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200'
            : 'bg-red-950/90 border-2 border-red-400 text-red-200'
        }`}>
          {claimFeedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-red-400" />
          )}
          <span>{claimFeedback.message}</span>
        </div>
      )}

      {/* Main Content Area: Classic Bingo Card + Dauber Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start mb-4">
        
        {/* Center / Left: The Official Classic 5x5 Bingo Card (8 cols) */}
        <div className="lg:col-span-8 flex flex-col items-center w-full">
          <div className="w-full max-w-xl bg-gradient-to-b from-amber-200 via-amber-100 to-amber-200 p-1.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-amber-400">
            
            {/* Inner Card Frame */}
            <div className="bg-[#101629] rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-amber-500/40 sm:border-2">
              
              {/* Card Top Serial & Quick Mobile Dauber Swatches */}
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-amber-300/90 px-0.5 mb-1.5 sm:mb-2">
                <span>OFFICIAL 75-BALL CARD</span>
                <div className="flex items-center gap-1.5">
                  {/* Mobile Quick Dauber Ink Swatches */}
                  <div className="flex lg:hidden items-center gap-1 mr-1">
                    {DAUBER_COLORS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          sound.playDaub();
                          setDauberColor(d.id);
                        }}
                        aria-label={`Select ${d.name}`}
                        className={`w-4 h-4 rounded-full ${d.swatch} border transition-transform ${
                          dauberColor === d.id ? 'scale-125 border-white ring-2 ring-amber-300' : 'border-white/50 opacity-75'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono">#{player.id.slice(-4).toUpperCase()}</span>
                </div>
              </div>

              {/* B - I - N - G - O Column Headers */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-1.5 sm:mb-3 text-center">
                {columnHeaders.map((col) => (
                  <div
                    key={col.letter}
                    className={`${col.bg} border sm:border-2 ${col.border} rounded-lg sm:rounded-xl py-1 sm:py-2 shadow-md flex flex-col items-center justify-center`}
                  >
                    <span className="font-black text-lg sm:text-3xl text-white leading-none drop-shadow">
                      {col.letter}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-white/85 tracking-wider mt-0.5">
                      {col.range}
                    </span>
                  </div>
                ))}
              </div>

              {/* 5x5 Classic Number Squares — Optimized for Mobile Touch & Readability */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                {player.card.map((row, r) =>
                  row.map((cell, c) => {
                    const key = toMarkedKey(r, c);
                    const isMarked = markedKeys.has(key);
                    const isDrawn = drawnValuesSet.has(cell.value.trim().toUpperCase());
                    const isReadyToMark = highlightCalled && isDrawn && !isMarked && !cell.isFree;
                    const isPartOfWin = winningCellsSet.has(key);

                    return (
                      <button
                        key={cell.id}
                        onClick={() => handleCellClick(cell)}
                        style={{ touchAction: 'manipulation' }}
                        className={`relative aspect-square flex flex-col items-center justify-center p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border sm:border-2 text-center transition-all transform select-none cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                          cell.isFree
                            ? 'bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 border-white text-slate-950 font-black shadow-inner'
                            : isReadyToMark
                            ? 'bg-amber-50 border-amber-400 text-slate-900 ring-2 sm:ring-4 ring-amber-400/50 animate-pulse'
                            : 'bg-[#f8fafc] hover:bg-white border-slate-300 text-slate-900 shadow-sm'
                        } ${isPartOfWin ? 'ring-2 sm:ring-4 ring-emerald-400 scale-[1.02] z-10' : ''}`}
                      >
                        {/* Free Space Star */}
                        {cell.isFree ? (
                          <div className="flex flex-col items-center justify-center">
                            <Star className="w-4 h-4 sm:w-8 sm:h-8 fill-slate-950 text-slate-950 mb-0.5" />
                            <span className="font-black text-[8px] sm:text-xs tracking-tighter uppercase leading-none">
                              FREE
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-base xs:text-lg sm:text-3xl md:text-4xl tracking-tight text-slate-900 z-10 leading-none">
                            {cell.displayLabel}
                          </span>
                        )}

                        {/* Authentic Circular Dauber Ink Stamp Overlay */}
                        {isMarked && !cell.isFree && (
                          <div
                            className={`absolute inset-1 sm:inset-2 rounded-full ${activeDauber.stampBg} border sm:border-2 ${activeDauber.stampBorder} shadow-lg flex items-center justify-center transition-transform scale-100 pointer-events-none`}
                            style={{
                              boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.35), 0 4px 10px rgba(0,0,0,0.25)',
                            }}
                          />
                        )}

                        {/* Hint Dot when called */}
                        {isReadyToMark && (
                          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500 animate-ping" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Mobile Quick Assist Bar directly inside the card footer */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex lg:hidden items-center justify-between gap-2 text-[11px]">
                <label className="flex items-center gap-1.5 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDaub}
                    onChange={(e) => {
                      sound.playClick();
                      setAutoDaub(e.target.checked);
                    }}
                    className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
                  />
                  <span>Auto-Daub</span>
                </label>

                <label className="flex items-center gap-1.5 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highlightCalled}
                    onChange={(e) => {
                      sound.playClick();
                      setHighlightCalled(e.target.checked);
                    }}
                    className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
                  />
                  <span>Glow Called</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Dauber Color Picker, Auto-Daub & Claim Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4 w-full">
          
          {/* Giant Illuminated BINGO Button Card */}
          <div className="bg-[#12182d] border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl text-center space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {currentWinningCheck.hasWon
                ? `🎉 WINNING PATTERN: ${currentWinningCheck.patternName}!`
                : 'GOT 5 IN A ROW OR CORNERS?'}
            </div>

            <button
              onClick={handleClaimBingo}
              disabled={claimLoading}
              className={`w-full py-5 px-6 rounded-2xl font-black text-2xl tracking-wider transition-all transform flex items-center justify-center gap-3 shadow-2xl cursor-pointer ${
                currentWinningCheck.hasWon
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-slate-950 hover:scale-105 ring-4 ring-amber-300/60 animate-bounce'
                  : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border-2 border-red-400/50 shadow-red-600/30'
              }`}
            >
              <Trophy className="w-7 h-7" />
              <span>{claimLoading ? 'CHECKING CARD...' : 'BINGO!'}</span>
            </button>

            <p className="text-[11px] text-slate-400">
              {currentWinningCheck.hasWon
                ? 'Click BINGO! right now to claim your prize!'
                : 'Mark 5 numbers in any row, column, diagonal, or 4 corners, then shout BINGO!'}
            </p>
          </div>

          {/* Dauber Ink Color Selector */}
          <div className="bg-[#12182d] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Palette className="w-4 h-4" />
              <span>CHOOSE DAUBER INK COLOR</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DAUBER_COLORS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    sound.playDaub();
                    setDauberColor(d.id);
                  }}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    dauberColor === d.id
                      ? 'bg-slate-800 border-amber-400 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${d.swatch} border border-white/60 shrink-0`} />
                  <span className="truncate">{d.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Player Assist Options (Auto-Daub & Call Highlight) */}
          <div className="bg-[#12182d] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Wand2 className="w-4 h-4" />
              <span>DAUBER ASSIST OPTIONS</span>
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Auto-Dauber</div>
                <div className="text-[10px] text-slate-400">Automatically stamp called numbers</div>
              </div>
              <input
                type="checkbox"
                checked={autoDaub}
                onChange={(e) => {
                  sound.playClick();
                  setAutoDaub(e.target.checked);
                }}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Highlight Called Numbers</div>
                <div className="text-[10px] text-slate-400">Glow numbers on card when drawn</div>
              </div>
              <input
                type="checkbox"
                checked={highlightCalled}
                onChange={(e) => {
                  sound.playClick();
                  setHighlightCalled(e.target.checked);
                }}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Hall Winners List */}
          {game.winners && game.winners.length > 0 && (
            <div className="bg-[#12182d] border border-amber-500/40 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span>BINGO WINNERS ({game.winners.length})</span>
              </div>
              {game.winners.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/80 p-2 rounded-lg border border-amber-500/20">
                  <span className="font-bold text-white">#{w.rank} {w.nickname}</span>
                  <span className="text-amber-300 font-mono">{w.patternName}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Sticky Mobile Bottom BINGO! Claim Bar (Visible on Phones/Tablets < lg) */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#0b0e1a]/95 backdrop-blur-lg border-t border-amber-500/40 px-3 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.65)]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 truncate">
              {currentWinningCheck.hasWon
                ? `🎉 ${currentWinningCheck.patternName}!`
                : '5 IN A ROW / CORNERS'}
            </div>
            <div className="text-[11px] font-mono text-slate-300 truncate">
              Score: <b className="text-amber-400">{player.score || 0} PTS</b>
            </div>
          </div>

          <button
            onClick={handleClaimBingo}
            disabled={claimLoading}
            style={{ touchAction: 'manipulation' }}
            className={`px-6 py-3 rounded-xl font-black text-base tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shrink-0 cursor-pointer active:scale-95 ${
              currentWinningCheck.hasWon
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-slate-950 ring-2 ring-amber-200 animate-pulse'
                : 'bg-gradient-to-r from-red-600 to-rose-700 text-white border border-red-400/50'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span>{claimLoading ? 'CHECKING...' : 'BINGO!'}</span>
          </button>
        </div>
      </div>

      {/* Winner Celebration Modal */}
      <WinnerModal
        isOpen={winnerModalData.isOpen}
        onClose={() => setWinnerModalData(prev => ({ ...prev, isOpen: false }))}
        winnerNickname={winnerModalData.nickname}
        patternName={winnerModalData.pattern}
        scoreAwarded={winnerModalData.score}
        rank={winnerModalData.rank}
        isSelf={winnerModalData.isSelf}
      />
    </div>
  );
};
