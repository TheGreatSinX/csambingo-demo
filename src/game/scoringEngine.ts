import { ScoringConfig } from './gameTypes';

export interface ScoreCalculationResult {
  totalScore: number;
  basePoints: number;
  rankBonus: number;
  speedBonus: number;
  penalty: number;
  breakdown: string[];
}

export function calculateBingoScore(
  scoringConfig: ScoringConfig,
  rank: number, // 1 for first winner, 2 for second, etc.
  secondsRemaining?: number
): ScoreCalculationResult {
  const breakdown: string[] = [];
  const basePoints = scoringConfig.baseWin || 100;
  breakdown.push(`Base Win: +${basePoints} pts`);

  let rankBonus = 0;
  if (rank === 1) {
    rankBonus = scoringConfig.firstWinnerBonus || 100;
    breakdown.push(`First Place Bonus: +${rankBonus} pts`);
  } else if (rank === 2) {
    rankBonus = scoringConfig.secondWinnerBonus || 75;
    breakdown.push(`Second Place Bonus: +${rankBonus} pts`);
  } else if (rank === 3) {
    rankBonus = scoringConfig.thirdWinnerBonus || 50;
    breakdown.push(`Third Place Bonus: +${rankBonus} pts`);
  }

  let speedBonus = 0;
  if (secondsRemaining && secondsRemaining > 0 && scoringConfig.speedBonusPerSecondRemaining) {
    speedBonus = Math.floor(secondsRemaining * scoringConfig.speedBonusPerSecondRemaining);
    breakdown.push(`Rapid Claim Speed Bonus: +${speedBonus} pts`);
  }

  const totalScore = basePoints + rankBonus + speedBonus;

  return {
    totalScore,
    basePoints,
    rankBonus,
    speedBonus,
    penalty: 0,
    breakdown,
  };
}

export function calculateFalseClaimPenalty(scoringConfig: ScoringConfig): number {
  return scoringConfig.falseClaimPenalty || 25;
}
