import { BingoCell, DrawItem, GameConfig, GameWinner } from './gameTypes';
import { evaluateBingoPatterns, toMarkedKey } from './patternEngine';
import { calculateBingoScore, calculateFalseClaimPenalty } from './scoringEngine';
import { SYSTEM_PATTERNS } from './seedData';

export interface ValidationResult {
  isValid: boolean;
  rejectReason?: string;
  patternName?: string;
  scoreAwarded?: number;
  penaltyAwarded?: number;
  matchedCells?: [number, number][];
  rank?: number;
}

export function validateBingoClaim(
  card: BingoCell[][],
  markedIndices: string[],
  drawHistory: DrawItem[],
  config: GameConfig,
  existingWinners: GameWinner[] = [],
  playerId: string
): ValidationResult {
  // 1. Check if player has already won
  const alreadyWon = existingWinners.some(w => w.playerId === playerId);
  if (alreadyWon) {
    return {
      isValid: false,
      rejectReason: 'Player has already registered a winning Bingo claim for this match.',
    };
  }

  // 2. Check if maximum winners reached
  if (!config.rules.allowMultipleWinners && existingWinners.length >= 1) {
    return {
      isValid: false,
      rejectReason: 'First place Bingo has already been claimed for this round.',
    };
  }

  if (existingWinners.length >= config.rules.maxWinners) {
    return {
      isValid: false,
      rejectReason: `Maximum winner limit (${config.rules.maxWinners}) has been reached.`,
    };
  }

  // 3. Build set of officially drawn values
  const drawnValuesSet = new Set<string>();
  drawHistory.forEach(d => {
    drawnValuesSet.add(d.value.trim().toUpperCase());
  });

  // 4. Anti-Cheat: Filter marked indices to only legitimately drawn cells or free cells
  const legitimateMarkedKeys = new Set<string>();
  const attemptedMarkedSet = new Set(markedIndices);

  const rows = card.length;
  const cols = card[0]?.length || 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = card[r][c];
      const key = toMarkedKey(r, c);

      if (cell.isFree) {
        legitimateMarkedKeys.add(key);
      } else if (attemptedMarkedSet.has(key)) {
        // Must verify cell value exists in drawHistory!
        const cellVal = cell.value.trim().toUpperCase();
        if (drawnValuesSet.has(cellVal)) {
          legitimateMarkedKeys.add(key);
        }
      }
    }
  }

  // 5. Evaluate winning patterns using only verified legitimately drawn cells
  const allPatterns = [...SYSTEM_PATTERNS, ...(config.customPatterns || [])];
  const patternResult = evaluateBingoPatterns(
    card,
    legitimateMarkedKeys,
    config.winningPatterns,
    allPatterns
  );

  if (!patternResult.hasWon) {
    const penalty = calculateFalseClaimPenalty(config.scoring);
    return {
      isValid: false,
      rejectReason: 'Incomplete or unverified pattern: Marked cells do not satisfy active winning patterns or contain un-drawn cells.',
      penaltyAwarded: penalty,
    };
  }

  // 6. Calculate authoritative score
  const rank = existingWinners.length + 1;
  const scoreResult = calculateBingoScore(config.scoring, rank);

  return {
    isValid: true,
    patternName: patternResult.patternName,
    matchedCells: patternResult.matchedCells,
    scoreAwarded: scoreResult.totalScore,
    rank,
  };
}
