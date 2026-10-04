import { BoardConfig, ContentType, BingoCell } from './gameTypes';
import { SEED_CYBER_TERMS } from './seedData';

// Generates an authentic classic bingo card for a player
export function generateBingoCard(
  boardConfig: BoardConfig,
  contentType: ContentType = 'numbers',
  customTerms?: string[],
  _seed?: number
): BingoCell[][] {
  const { rows, columns, freeSpace, freeSpacePosition, freeSpaceLabel } = boardConfig;
  const freeR = freeSpacePosition?.row ?? Math.floor(rows / 2);
  const freeC = freeSpacePosition?.column ?? Math.floor(columns / 2);

  // Initialize empty rows x cols grid
  const grid: BingoCell[][] = Array.from({ length: rows }, () => []);

  if (contentType === 'numbers') {
    // Classic 75-Ball column distribution
    const colRanges = [
      { min: 1, max: 15, prefix: 'B', color: '#ef4444' },
      { min: 16, max: 30, prefix: 'I', color: '#f59e0b' },
      { min: 31, max: 45, prefix: 'N', color: '#3b82f6' },
      { min: 46, max: 60, prefix: 'G', color: '#10b981' },
      { min: 61, max: 75, prefix: 'O', color: '#8b5cf6' },
    ];

    for (let c = 0; c < columns; c++) {
      const range = colRanges[c % colRanges.length];
      const numbersInCol: number[] = [];

      // Pick distinct random numbers for this column
      while (numbersInCol.length < rows) {
        const num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        if (!numbersInCol.includes(num)) {
          numbersInCol.push(num);
        }
      }

      // Assign to each row in column c
      for (let r = 0; r < rows; r++) {
        const isFree = freeSpace && r === freeR && c === freeC;
        const num = numbersInCol[r];

        grid[r][c] = {
          id: `cell_${r}_${c}`,
          row: r,
          col: c,
          value: isFree ? 'FREE' : `${num}`,
          displayLabel: isFree ? (freeSpaceLabel || '★ FREE ★') : `${num}`,
          isFree,
          category: isFree ? 'Special' : `${range.prefix}-${num}`,
          description: isFree ? 'Classic Bingo Free Space' : `Column ${range.prefix} Ball #${num}`,
        };
      }
    }
  } else {
    // Term or Custom pool
    const totalCellsNeeded = rows * columns;
    const termsSource: { value: string; displayLabel: string; category?: string; description?: string }[] = customTerms && customTerms.length >= totalCellsNeeded
      ? customTerms.map(t => ({ value: t, displayLabel: t, category: 'Custom', description: '' }))
      : SEED_CYBER_TERMS.map(t => ({
          value: t.term,
          displayLabel: t.term,
          category: t.category,
          description: t.description,
        }));

    const shuffled = [...termsSource].sort(() => Math.random() - 0.5);
    const pool = shuffled.slice(0, totalCellsNeeded);
    let poolIndex = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const isFree = freeSpace && r === freeR && c === freeC;
        const cellData = pool[poolIndex % pool.length];
        poolIndex++;

        grid[r][c] = {
          id: `cell_${r}_${c}`,
          row: r,
          col: c,
          value: isFree ? 'FREE' : cellData.value,
          displayLabel: isFree ? (freeSpaceLabel || '★ FREE ★') : cellData.displayLabel,
          isFree,
          category: isFree ? 'Special' : cellData.category,
          description: cellData.description,
        };
      }
    }
  }

  return grid;
}
