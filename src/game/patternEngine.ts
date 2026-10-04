import { WinningPattern, BingoCell } from './gameTypes';

export interface PatternCheckResult {
  hasWon: boolean;
  patternName: string;
  matchedCells: [number, number][];
}

// Convert "r_c" string to [row, col]
export function parseMarkedKey(key: string): [number, number] {
  const parts = key.split('_');
  return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
}

export function toMarkedKey(row: number, col: number): string {
  return `${row}_${col}`;
}

export function evaluateBingoPatterns(
  card: BingoCell[][],
  markedKeys: Set<string>,
  activePatternIds: string[],
  customPatterns: WinningPattern[] = []
): PatternCheckResult {
  const rows = card.length;
  const cols = card[0]?.length || 0;

  if (rows === 0 || cols === 0) {
    return { hasWon: false, patternName: '', matchedCells: [] };
  }

  // Always mark free space as matched
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (card[r][c].isFree) {
        markedKeys.add(toMarkedKey(r, c));
      }
    }
  }

  // 1. Check Horizontal Rows
  if (activePatternIds.includes('pattern-horizontal') || activePatternIds.includes('horizontal')) {
    for (let r = 0; r < rows; r++) {
      let full = true;
      const matched: [number, number][] = [];
      for (let c = 0; c < cols; c++) {
        if (!markedKeys.has(toMarkedKey(r, c))) {
          full = false;
          break;
        }
        matched.push([r, c]);
      }
      if (full) {
        return { hasWon: true, patternName: `Horizontal Row ${r + 1}`, matchedCells: matched };
      }
    }
  }

  // 2. Check Vertical Columns
  if (activePatternIds.includes('pattern-vertical') || activePatternIds.includes('vertical')) {
    for (let c = 0; c < cols; c++) {
      let full = true;
      const matched: [number, number][] = [];
      for (let r = 0; r < rows; r++) {
        if (!markedKeys.has(toMarkedKey(r, c))) {
          full = false;
          break;
        }
        matched.push([r, c]);
      }
      if (full) {
        return { hasWon: true, patternName: `Vertical Column ${c + 1}`, matchedCells: matched };
      }
    }
  }

  // 3. Check Main Diagonals
  if (activePatternIds.includes('pattern-diagonal') || activePatternIds.includes('diagonal')) {
    if (rows === cols) {
      // Top-left to bottom-right
      let diag1Full = true;
      const diag1Matched: [number, number][] = [];
      for (let i = 0; i < rows; i++) {
        if (!markedKeys.has(toMarkedKey(i, i))) {
          diag1Full = false;
          break;
        }
        diag1Matched.push([i, i]);
      }
      if (diag1Full) {
        return { hasWon: true, patternName: 'Diagonal Line (TL to BR)', matchedCells: diag1Matched };
      }

      // Top-right to bottom-left
      let diag2Full = true;
      const diag2Matched: [number, number][] = [];
      for (let i = 0; i < rows; i++) {
        const colIdx = cols - 1 - i;
        if (!markedKeys.has(toMarkedKey(i, colIdx))) {
          diag2Full = false;
          break;
        }
        diag2Matched.push([i, colIdx]);
      }
      if (diag2Full) {
        return { hasWon: true, patternName: 'Diagonal Line (TR to BL)', matchedCells: diag2Matched };
      }
    }
  }

  // 4. Check Four Corners
  if (activePatternIds.includes('pattern-four-corners') || activePatternIds.includes('four_corners')) {
    const corners: [number, number][] = [
      [0, 0],
      [0, cols - 1],
      [rows - 1, 0],
      [rows - 1, cols - 1]
    ];
    const allCornersMarked = corners.every(([r, c]) => markedKeys.has(toMarkedKey(r, c)));
    if (allCornersMarked) {
      return { hasWon: true, patternName: 'Four Corners', matchedCells: corners };
    }
  }

  // 4b. Check Postage Stamp (2x2 square in any of the four corners)
  if (activePatternIds.includes('pattern-postage-stamp') || activePatternIds.includes('postage_stamp')) {
    if (rows >= 2 && cols >= 2) {
      const stampOffsets: [number, number][][] = [
        [[0, 0], [0, 1], [1, 0], [1, 1]], // Top-Left
        [[0, cols - 2], [0, cols - 1], [1, cols - 2], [1, cols - 1]], // Top-Right
        [[rows - 2, 0], [rows - 2, 1], [rows - 1, 0], [rows - 1, 1]], // Bottom-Left
        [[rows - 2, cols - 2], [rows - 2, cols - 1], [rows - 1, cols - 2], [rows - 1, cols - 1]], // Bottom-Right
      ];

      for (const stamp of stampOffsets) {
        if (stamp.every(([r, c]) => markedKeys.has(toMarkedKey(r, c)))) {
          return { hasWon: true, patternName: 'Postage Stamp', matchedCells: stamp };
        }
      }
    }
  }

  // 5. Check X-Mode (Both Diagonals)
  if (activePatternIds.includes('pattern-x-mode') || activePatternIds.includes('x_mode')) {
    if (rows === cols) {
      const xCells: [number, number][] = [];
      let xComplete = true;
      for (let i = 0; i < rows; i++) {
        const c1 = i;
        const c2 = cols - 1 - i;
        if (!markedKeys.has(toMarkedKey(i, c1)) || !markedKeys.has(toMarkedKey(i, c2))) {
          xComplete = false;
          break;
        }
        xCells.push([i, c1]);
        if (c1 !== c2) xCells.push([i, c2]);
      }
      if (xComplete) {
        return { hasWon: true, patternName: 'Cyber X Pattern', matchedCells: xCells };
      }
    }
  }

  // 6. Check Blackout
  if (activePatternIds.includes('pattern-blackout') || activePatternIds.includes('blackout')) {
    let allMarked = true;
    const allCells: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!markedKeys.has(toMarkedKey(r, c))) {
          allMarked = false;
          break;
        }
        allCells.push([r, c]);
      }
      if (!allMarked) break;
    }
    if (allMarked) {
      return { hasWon: true, patternName: 'Full Blackout', matchedCells: allCells };
    }
  }

  // 7. Check System Patterns & Custom Patterns with specific coordinate arrays
  for (const customPattern of customPatterns) {
    if (activePatternIds.includes(customPattern.id)) {
      if (customPattern.cells && customPattern.cells.length > 0) {
        const allCustomCellsMarked = customPattern.cells.every(([r, c]) => 
          r < rows && c < cols && markedKeys.has(toMarkedKey(r, c))
        );
        if (allCustomCellsMarked) {
          return {
            hasWon: true,
            patternName: customPattern.name,
            matchedCells: customPattern.cells,
          };
        }
      }
    }
  }

  return { hasWon: false, patternName: '', matchedCells: [] };
}
