import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Radio, 
  Play, 
  Pause, 
  Square, 
  Users, 
  Trophy, 
  Copy, 
  Check, 
  History,
  Timer,
  Volume2,
  Gamepad2
} from 'lucide-react';
import { 
  subscribeToGame, 
  subscribeToPlayers, 
  subscribeToDraws, 
  subscribeToClaims,
  hostDrawNextItem, 
  updateGameStatus,
  createGameRoom
} from '../services/gameService';
import { DEFAULT_GAME_CONFIG } from '../game/seedData';
import { LiveGame, Player, DrawItem, BingoClaim, GameStatus } from '../game/gameTypes';
import { ClassicBingoBall } from '../components/ClassicBingoBall';
import { ClassicFlashboard } from '../components/ClassicFlashboard';
import { sound } from '../game/soundEngine';

export const HostGamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<LiveGame | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [draws, setDraws] = useState<DrawItem[]>([]);
  const [claims, setClaims] = useState<BingoClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPin, setCopiedPin] = useState(false);
  const [autoDrawEnabled, setAutoDrawEnabled] = useState(false);
  const [callerIntervalSec, setCallerIntervalSec] = useState(5);
  const [autoDrawSecondsLeft, setAutoDrawSecondsLeft] = useState(5);
  const [actionLoading, setActionLoading] = useState(false);

  const autoDrawTimerRef = useRef<any>(null);
  const lastAnnouncedDrawIdRef = useRef<string | null>(null);

  // If no gameId provided in URL, automatically launch a Classic 75-Ball Hall
  useEffect(() => {
    if (!gameId) {
      const launchDefault = async () => {
        setLoading(true);
        const newGame = await createGameRoom(
          'CLASSIC 75-BALL BINGO HALL',
          DEFAULT_GAME_CONFIG,
          'host_primary',
          'caller@classicbingo.hall'
        );
        navigate(`/host/${newGame.id}`, { replace: true });
      };
      launchDefault();
    }
  }, [gameId, navigate]);

  // Subscriptions
  useEffect(() => {
    if (!gameId) return;

    setLoading(true);
    const unsubGame = subscribeToGame(gameId, (g) => {
      setGame(g);
      setLoading(false);
    });

    const unsubPlayers = subscribeToPlayers(gameId, (pList) => {
      setPlayers(pList);
    });

    const unsubDraws = subscribeToDraws(gameId, (dList) => {
      setDraws(dList);
    });

    const unsubClaims = subscribeToClaims(gameId, (cList) => {
      setClaims(cList);
    });

    return () => {
      unsubGame();
      unsubPlayers();
      unsubDraws();
      unsubClaims();
      if (autoDrawTimerRef.current) clearInterval(autoDrawTimerRef.current);
    };
  }, [gameId]);

  // Announce newly drawn ball with sound & speech caller
  useEffect(() => {
    if (draws.length === 0) return;
    const latest = draws[draws.length - 1];
    if (latest && latest.id !== lastAnnouncedDrawIdRef.current) {
      lastAnnouncedDrawIdRef.current = latest.id;
      sound.playBallRoll();
      sound.announceBall(latest.displayLabel);
    }
  }, [draws]);

  // Auto-draw interval loop
  useEffect(() => {
    if (!autoDrawEnabled || !game || game.status !== 'ACTIVE') {
      if (autoDrawTimerRef.current) clearInterval(autoDrawTimerRef.current);
      return;
    }

    setAutoDrawSecondsLeft(callerIntervalSec);

    autoDrawTimerRef.current = setInterval(async () => {
      setAutoDrawSecondsLeft((prev) => {
        if (prev <= 1) {
          hostDrawNextItem(game.id).then((next) => {
            if (!next) {
              setAutoDrawEnabled(false);
            }
          });
          return callerIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoDrawTimerRef.current) clearInterval(autoDrawTimerRef.current);
    };
  }, [autoDrawEnabled, game?.status, game?.id, callerIntervalSec]);

  // Manual Draw
  const handleManualDraw = async () => {
    if (!game || actionLoading) return;
    setActionLoading(true);
    sound.playClick();
    try {
      if (game.status === 'LOBBY') {
        await updateGameStatus(game.id, 'ACTIVE', game.hostId);
      }
      await hostDrawNextItem(game.id);
    } finally {
      setActionLoading(false);
    }
  };

  // Change Status (Start, Pause, Resume, End)
  const handleStatusChange = async (status: GameStatus) => {
    if (!game) return;
    sound.playClick();
    if (status === 'FINISHED' || status === 'PAUSED') {
      setAutoDrawEnabled(false);
    }
    await updateGameStatus(game.id, status, game.hostId);
  };

  const copyPinToClipboard = () => {
    if (!game) return;
    navigator.clipboard.writeText(game.pin);
    setCopiedPin(true);
    sound.playClick();
    setTimeout(() => setCopiedPin(false), 2000);
  };

  if (loading || !game) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-[#0b0e1a] text-center">
        <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-black text-xl text-amber-300 tracking-wider">
          OPENING BINGO CALLER STAGE...
        </div>
      </div>
    );
  }

  const latestDraw = draws[draws.length - 1];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-[#0b0e1a] via-[#11172b] to-[#090c16] max-w-7xl mx-auto">
      
      {/* Top Host Caller Stage Bar */}
      <div className="bg-[#12182d]/95 border-2 border-amber-500/30 rounded-3xl p-5 mb-6 backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Hall Info */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-lg">
            <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xl text-white tracking-wide">{game.title}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-400/50 text-amber-300">
                CALLER STAGE
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
              <span>BALLS CALLED: <b className="text-amber-300">{draws.length} / 75</b></span>
              <span>•</span>
              <span>PLAYERS: <b className="text-emerald-300">{players.length}</b></span>
            </div>
          </div>
        </div>

        {/* Center: Giant Room PIN */}
        <div className="flex items-center gap-3 bg-slate-950/90 border-2 border-amber-500/50 rounded-2xl px-5 py-2.5 shadow-inner">
          <div className="text-right">
            <div className="text-[10px] font-bold text-amber-400 tracking-widest uppercase">ROOM PIN</div>
            <div className="font-mono font-black text-2xl tracking-[0.2em] text-white">
              {game.pin}
            </div>
          </div>
          <button
            onClick={copyPinToClipboard}
            className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 transition-colors cursor-pointer"
            title="Copy PIN to clipboard"
          >
            {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Right: Quick Stage Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {game.status === 'LOBBY' && (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              className="px-5 py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>START BINGO GAME</span>
            </button>
          )}

          {game.status === 'ACTIVE' && (
            <button
              onClick={() => handleStatusChange('PAUSED')}
              className="px-4 py-2.5 rounded-xl font-black text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-slate-950" />
              <span>PAUSE</span>
            </button>
          )}

          {game.status === 'PAUSED' && (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              className="px-4 py-2.5 rounded-xl font-black text-sm bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>RESUME</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/game/${game.id}`)}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-blue-600/30 border border-blue-400/50 text-blue-200 hover:bg-blue-600/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Play a Bingo card in this room"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>JOIN WITH CARD</span>
          </button>

          {game.status !== 'FINISHED' && (
            <button
              onClick={() => handleStatusChange('FINISHED')}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>END</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Caller Hopper & 75-Ball Flashboard (8 cols), Right Players & Winners (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Caller Ball Cage & Master Flashboard (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Giant Caller Machine Panel */}
          <div className="bg-gradient-to-b from-[#151d38] to-[#0e1428] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-wider mb-4">
              <span>OFFICIAL 75-BALL CALLER HOPPER</span>
              <span>BALL #{draws.length} OF 75</span>
            </div>

            {/* Center 3D Ball Display */}
            <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-6">
              {latestDraw ? (
                <ClassicBingoBall
                  value={latestDraw.value}
                  label={latestDraw.displayLabel}
                  size="giant"
                  animated={true}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-dashed border-amber-500/40 flex items-center justify-center text-amber-300 font-black text-sm p-4">
                  CAGE READY
                </div>
              )}

              <div className="text-center sm:text-left space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  CURRENT CALLED NUMBER
                </div>
                <div className="font-black text-4xl sm:text-6xl text-white tracking-tight">
                  {latestDraw ? latestDraw.displayLabel : 'READY TO ROLL'}
                </div>
                {latestDraw && (
                  <button
                    onClick={() => sound.announceBall(latestDraw.displayLabel)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs font-bold text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Announce "{latestDraw.displayLabel}" Again</span>
                  </button>
                )}
              </div>
            </div>

            {/* Caller Action Controls & Speed */}
            <div className="pt-6 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleManualDraw}
                disabled={actionLoading || draws.length >= 75}
                className="px-8 py-4 rounded-2xl font-black tracking-wide text-base text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                🎱 DRAW NEXT BALL
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  if (game.status === 'LOBBY') {
                    updateGameStatus(game.id, 'ACTIVE', game.hostId);
                  }
                  setAutoDrawEnabled(!autoDrawEnabled);
                }}
                className={`px-5 py-4 rounded-2xl font-bold text-sm border-2 flex items-center gap-2 transition-all cursor-pointer ${
                  autoDrawEnabled
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span>
                  {autoDrawEnabled ? `AUTO-CALLING IN ${autoDrawSecondsLeft}s` : 'START AUTO-CALLER'}
                </span>
              </button>

              {/* Speed Selector */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                {[
                  { sec: 3, label: 'Fast 3s' },
                  { sec: 5, label: 'Normal 5s' },
                  { sec: 8, label: 'Relaxed 8s' },
                ].map((spd) => (
                  <button
                    key={spd.sec}
                    onClick={() => {
                      sound.playClick();
                      setCallerIntervalSec(spd.sec);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      callerIntervalSec === spd.sec
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full 75-Ball Master Flashboard */}
          <ClassicFlashboard draws={draws} />

          {/* Past Draws Reel */}
          {draws.length > 0 && (
            <div className="bg-[#10162b] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase mb-3">
                <History className="w-4 h-4" />
                <span>RECENT CALLED BALLS (NEWEST FIRST)</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {draws.slice().reverse().map((d) => (
                  <ClassicBingoBall key={d.id} value={d.value} size="md" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Winners Podium & Connected Players (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Winners Podium */}
          <div className="bg-[#12182d] border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase mb-3">
              <Trophy className="w-5 h-5" />
              <span>BINGO HALL WINNERS</span>
            </div>

            {!game.winners || game.winners.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No Bingo claimed yet. Waiting for the first lucky winner!
              </div>
            ) : (
              <div className="space-y-2.5">
                {game.winners.map((w, idx) => (
                  <div
                    key={w.playerId + idx}
                    className="p-3 rounded-xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                        #{w.rank}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{w.nickname}</div>
                        <div className="text-[10px] text-amber-300">{w.patternName}</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-amber-400">
                      +{w.score} PTS
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connected Players Roster */}
          <div className="bg-[#12182d] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase">
                <Users className="w-4 h-4 text-amber-400" />
                <span>PLAYERS IN HALL ({players.length})</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">● LIVE</span>
            </div>

            {players.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Share Room PIN <b className="text-amber-300">{game.pin}</b> with players to join the hall!
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {players.map((p) => {
                  const markedCount = p.markedIndices?.length || 1;
                  const total = (game.configSnapshot.board.rows * game.configSnapshot.board.columns);
                  const progressPct = Math.round((markedCount / total) * 100);

                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-white font-bold">{p.nickname}</span>
                        {p.isBot && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">BOT</span>}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[11px]">{markedCount}/25 daubed ({progressPct}%)</span>
                        <span className="text-amber-400 font-bold">{p.score || 0} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Claim Verification Feed */}
          <div className="bg-[#12182d] border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-400 uppercase mb-2">RECENT BINGO CLAIMS:</div>
            {claims.length === 0 ? (
              <div className="text-[11px] text-slate-500">No Bingo claims submitted yet.</div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                {claims.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-900/60">
                    <span className="text-slate-200 font-medium">{c.playerNickname} — {c.patternName}</span>
                    <span className={`font-bold ${c.status === 'VERIFIED' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
