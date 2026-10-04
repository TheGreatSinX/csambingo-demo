import { DrawConfig, DrawItem } from './gameTypes';
import { SEED_CYBER_TERMS } from './seedData';

export function initializeDrawPool(
  config: DrawConfig,
  customTerms?: string[]
): { value: string; displayLabel: string; category: string; description: string }[] {
  if (config.contentType === 'numbers') {
    const min = config.numberRangeMin || 1;
    const max = config.numberRangeMax || 75;
    const pool = [];
    for (let i = min; i <= max; i++) {
      let letter = 'O';
      if (i <= 15) letter = 'B';
      else if (i <= 30) letter = 'I';
      else if (i <= 45) letter = 'N';
      else if (i <= 60) letter = 'G';

      pool.push({
        value: `${i}`,
        displayLabel: `${letter}-${i}`,
        category: `Column ${letter}`,
        description: `Official 75-Ball Classic Bingo — Column ${letter}, Number ${i}`,
      });
    }
    return pool;
  }

  // Cyber terms
  if (customTerms && customTerms.length > 0) {
    return customTerms.map(t => ({
      value: t,
      displayLabel: t,
      category: 'Custom Term',
      description: `Bingo Term: ${t}`,
    }));
  }

  return SEED_CYBER_TERMS.map(t => ({
    value: t.term,
    displayLabel: t.term,
    category: t.category || 'General',
    description: t.description || `Bingo Term: ${t.term}`,
  }));
}

export function drawNextItem(
  gameId: string,
  config: DrawConfig,
  existingDraws: DrawItem[],
  customTerms?: string[]
): DrawItem | null {
  const fullPool = initializeDrawPool(config, customTerms);
  const alreadyDrawnValues = new Set(existingDraws.map(d => d.value.trim().toUpperCase()));

  const remaining = fullPool.filter(item => !alreadyDrawnValues.has(item.value.trim().toUpperCase()));

  if (remaining.length === 0) {
    return null; // All items drawn
  }

  const selectedIndex = Math.floor(Math.random() * remaining.length);
  const selected = remaining[selectedIndex];

  return {
    id: `draw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    gameId,
    sequence: existingDraws.length + 1,
    value: selected.value,
    displayLabel: selected.displayLabel,
    category: selected.category || 'Number Draw',
    description: selected.description || `Ball ${selected.displayLabel}`,
    drawnAt: new Date().toISOString(),
  };
}
