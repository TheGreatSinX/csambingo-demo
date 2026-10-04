export type GameStatus = 
  | 'LOBBY' 
  | 'STARTING' 
  | 'ACTIVE' 
  | 'PAUSED' 
  | 'WIN_DETECTED' 
  | 'ROUND_COMPLETE' 
  | 'FINISHED' 
  | 'CANCELLED';

export type GameMode = 
  | 'classic' 
  | 'blackout' 
  | 'four_corners' 
  | 'horizontal' 
  | 'vertical' 
  | 'diagonal' 
  | 'x_mode' 
  | 'custom_pattern' 
  | 'cyber_grid';

export type ContentType = 'numbers' | 'cyber_terms' | 'questions';

export interface BoardConfig {
  rows: number;
  columns: number;
  freeSpace: boolean;
  freeSpacePosition?: {
    row: number;
    column: number;
  };
  freeSpaceLabel?: string;
}

export interface DrawConfig {
  intervalMs: number;
  automatic: boolean;
  contentType: ContentType;
  numberRangeMin?: number;
  numberRangeMax?: number;
  categoryFilter?: string;
}

export interface RulesConfig {
  allowMultipleWinners: boolean;
  maxWinners: number;
  falseClaimPenalty: number;
  minPlayers: number;
  maxPlayers: number;
  speedBonusEnabled: boolean;
}

export interface ScoringConfig {
  baseWin: number;
  firstWinnerBonus: number;
  secondWinnerBonus: number;
  thirdWinnerBonus: number;
  falseClaimPenalty: number;
  speedBonusPerSecondRemaining?: number;
}

export interface WinningPattern {
  id: string;
  name: string;
  description: string;
  rows: number;
  cols: number;
  cells: [number, number][]; // [row, col] coordinates
  isSystem?: boolean;
  createdAt?: string;
}

export interface GameEvent {
  id: string;
  gameId: string;
  type: string;
  message: string;
  timestamp: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  primaryColor: string;     // e.g. #00f5ff (neon cyan)
  secondaryColor: string;   // e.g. #00ff88 (neon green)
  accentColor: string;      // e.g. #a855f7 (purple)
  backgroundColor: string;  // e.g. #050811
  textColor: string;        // e.g. #e2e8f0
  cardBackground: string;   // e.g. #0a0f1d
  cellRadius: string;       // e.g. 0.5rem
  glowIntensity: 'subtle' | 'high' | 'off';
  fontFamily: string;
}

export interface GameConfig {
  id?: string;
  version: number;
  name: string;
  description?: string;
  board: BoardConfig;
  mode: GameMode;
  draw: DrawConfig;
  rules: RulesConfig;
  scoring: ScoringConfig;
  winningPatterns: string[]; // pattern IDs
  customPatterns?: WinningPattern[];
  theme: ThemeConfig;
  contentSetId?: string;
}

export interface BingoCell {
  id: string;
  row: number;
  col: number;
  value: string; // The official number or term
  displayLabel: string;
  isFree: boolean;
  category?: string;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface PlayerCard {
  playerId: string;
  gameId: string;
  cells: BingoCell[][]; // rows x cols
  totalCells: number;
}

export interface Player {
  id: string;
  gameId: string;
  nickname: string;
  avatarSeed?: string;
  card: BingoCell[][];
  markedIndices: string[]; // string representation of [row,col] like "r_c"
  score: number;
  hasWon: boolean;
  connected: boolean;
  joinedAt: string;
  lastPing?: string;
  claimsCount?: number;
  winRank?: number;
  isBot?: boolean;
}

export interface DrawItem {
  id: string;
  gameId: string;
  sequence: number;
  value: string;
  displayLabel: string;
  category?: string;
  description?: string;
  drawnAt: string;
}

export type ClaimStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface BingoClaim {
  id: string;
  gameId: string;
  playerId: string;
  playerNickname: string;
  patternName: string;
  matchedCells: [number, number][];
  status: ClaimStatus;
  claimedAt: string;
  verifiedAt?: string;
  scoreAwarded?: number;
  rejectReason?: string;
}

export interface GameWinner {
  playerId: string;
  nickname: string;
  rank: number;
  patternName: string;
  score: number;
  wonAt: string;
}

export interface HallOfFameEntry {
  id: string;
  gameId: string;
  gamePin: string;
  gameTitle: string;
  gameMode: string;
  roundNumber: number;
  playerId: string;
  playerNickname: string;
  patternName: string;
  scoreAwarded: number;
  rank: number;
  totalDrawsAtWin: number;
  wonAt: string;
}

export interface LiveGame {
  id: string;
  pin: string;
  title: string;
  status: GameStatus;
  hostId: string;
  hostEmail?: string;
  configSnapshot: GameConfig;
  roundNumber?: number;
  drawCount: number;
  currentDraw?: DrawItem | null;
  drawHistory: DrawItem[];
  winners: GameWinner[];
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  playerCount: number;
}

export interface CMSContentItem {
  id: string;
  term: string;
  category: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  active: boolean;
  createdAt: string;
}

export interface CMSQuestionItem {
  id: string;
  question: string;
  answer: string;
  options: string[];
  explanation: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  timeLimit?: number;
  active: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resource: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export type AdminRole = 'SUPER_ADMIN' | 'GAME_ADMIN' | 'CONTENT_ADMIN' | 'ANALYTICS_ADMIN';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  mfaEnforced: boolean;
  totpEnrolled?: boolean;
  totpSecret?: string;
  lastLogin?: string;
}
