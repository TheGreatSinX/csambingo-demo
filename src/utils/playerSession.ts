// Persistent Player Nickname Session Manager with 8-Hour TTL (Time-to-Live)

const PLAYER_NICKNAME_STORAGE_KEY = 'cyber_bingo_persistent_nickname_session';
export const NICKNAME_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

interface StoredNicknameSession {
  nickname: string;
  savedAt: number;
  expiresAt: number;
}

/**
 * Purges the stored player nickname from localStorage if the 8-hour TTL has expired.
 * Returns the valid nickname if still within the 8-hour window, or null if expired/missing.
 */
export function purgeExpiredPlayerNickname(): string | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(PLAYER_NICKNAME_STORAGE_KEY);
    if (!raw) return null;

    const parsed: StoredNicknameSession = JSON.parse(raw);
    const now = Date.now();

    if (!parsed || typeof parsed.nickname !== 'string' || typeof parsed.expiresAt !== 'number') {
      localStorage.removeItem(PLAYER_NICKNAME_STORAGE_KEY);
      return null;
    }

    if (now >= parsed.expiresAt) {
      // 8-hour window expired: purge stored nickname
      localStorage.removeItem(PLAYER_NICKNAME_STORAGE_KEY);
      return null;
    }

    return parsed.nickname.trim() || null;
  } catch {
    try {
      localStorage.removeItem(PLAYER_NICKNAME_STORAGE_KEY);
    } catch {}
    return null;
  }
}

/**
 * Retrieves the stored player nickname if within the 8-hour TTL window.
 */
export function getStoredPlayerNickname(): string {
  return purgeExpiredPlayerNickname() || '';
}

/**
 * Saves the player's nickname in localStorage with an 8-hour TTL timestamp.
 */
export function savePlayerNicknameWithTtl(nickname: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  const clean = nickname.trim();
  if (!clean) return;

  const now = Date.now();
  const payload: StoredNicknameSession = {
    nickname: clean,
    savedAt: now,
    expiresAt: now + NICKNAME_TTL_MS,
  };

  try {
    localStorage.setItem(PLAYER_NICKNAME_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Returns remaining time in human-readable format if a valid nickname session exists.
 */
export function getNicknameSessionRemainingLabel(): string | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(PLAYER_NICKNAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredNicknameSession = JSON.parse(raw);
    const remainingMs = parsed.expiresAt - Date.now();
    if (remainingMs <= 0) {
      localStorage.removeItem(PLAYER_NICKNAME_STORAGE_KEY);
      return null;
    }
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const mins = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  } catch {
    return null;
  }
}
