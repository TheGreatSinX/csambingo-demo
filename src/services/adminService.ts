import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  CMSContentItem,
  CMSQuestionItem,
  ThemeConfig,
  WinningPattern,
  AuditLogItem,
  AdminUser,
  GameConfig,
  LiveGame,
  HallOfFameEntry
} from '../game/gameTypes';
import {
  SEED_CYBER_TERMS,
  SEED_QUESTIONS,
  SYSTEM_PATTERNS,
  DEFAULT_THEMES,
  DEFAULT_GAME_CONFIG
} from '../game/seedData';

// Helper to strip undefined fields recursively so Firestore setDoc never fails on optional properties
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// 1. Audit Logging (Append-only)
export async function appendAuditLog(entry: {
  actorId: string;
  actorEmail: string;
  action: string;
  resource: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  try {
    await setDoc(doc(db, 'auditLogs', logId), {
      id: logId,
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      action: entry.action,
      resource: entry.resource,
      metadata: entry.metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Non-blocking log write
    console.error('Audit log error:', error);
  }
}

export async function fetchAuditLogs(limitCount: number = 50): Promise<AuditLogItem[]> {
  try {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const logs: AuditLogItem[] = [];
    snap.forEach(d => logs.push(d.data() as AuditLogItem));
    return logs;
  } catch (error) {
    console.warn('Audit log read error:', error);
    return [];
  }
}

// 2. Content CMS (Terms / Concepts)
export async function fetchContentItems(): Promise<CMSContentItem[]> {
  try {
    const snap = await getDocs(collection(db, 'content'));
    const items: CMSContentItem[] = [];
    snap.forEach(d => items.push(d.data() as CMSContentItem));
    if (items.length > 0) return items;
    return SEED_CYBER_TERMS.map((t, idx) => ({
      ...t,
      id: `term_${idx + 1}`,
      createdAt: new Date().toISOString(),
    }));
  } catch {
    return SEED_CYBER_TERMS.map((t, idx) => ({
      ...t,
      id: `term_${idx + 1}`,
      createdAt: new Date().toISOString(),
    }));
  }
}

export async function saveContentItem(item: CMSContentItem, actorEmail: string = 'admin'): Promise<void> {
  try {
    await setDoc(doc(db, 'content', item.id), sanitizeForFirestore(item));
    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'CONTENT_SAVED',
      resource: `content/${item.id}`,
      metadata: { term: item.term, category: item.category },
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `content/${item.id}`);
  }
}

export async function deleteContentItem(itemId: string, actorEmail: string = 'admin'): Promise<void> {
  try {
    await deleteDoc(doc(db, 'content', itemId));
    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'CONTENT_DELETED',
      resource: `content/${itemId}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `content/${itemId}`);
  }
}

// 3. Question Bank
export async function fetchQuestions(): Promise<CMSQuestionItem[]> {
  try {
    const snap = await getDocs(collection(db, 'questions'));
    const items: CMSQuestionItem[] = [];
    snap.forEach(d => items.push(d.data() as CMSQuestionItem));
    if (items.length > 0) return items;
    return SEED_QUESTIONS.map((q, idx) => ({
      ...q,
      id: `q_${idx + 1}`,
      createdAt: new Date().toISOString(),
    }));
  } catch {
    return SEED_QUESTIONS.map((q, idx) => ({
      ...q,
      id: `q_${idx + 1}`,
      createdAt: new Date().toISOString(),
    }));
  }
}

export async function saveQuestionItem(item: CMSQuestionItem, actorEmail: string = 'admin'): Promise<void> {
  try {
    await setDoc(doc(db, 'questions', item.id), sanitizeForFirestore(item));
    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'QUESTION_SAVED',
      resource: `questions/${item.id}`,
      metadata: { question: item.question },
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `questions/${item.id}`);
  }
}

export async function deleteQuestionItem(questionId: string, actorEmail: string = 'admin'): Promise<void> {
  try {
    await deleteDoc(doc(db, 'questions', questionId));
    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'QUESTION_DELETED',
      resource: `questions/${questionId}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `questions/${questionId}`);
  }
}

// 4. Themes
export async function fetchThemes(): Promise<ThemeConfig[]> {
  try {
    const snap = await getDocs(collection(db, 'themes'));
    const items: ThemeConfig[] = [];
    snap.forEach(d => items.push(d.data() as ThemeConfig));
    if (items.length === 0) return DEFAULT_THEMES;
    return items;
  } catch {
    return DEFAULT_THEMES;
  }
}

export async function saveTheme(theme: ThemeConfig, actorEmail: string = 'admin'): Promise<void> {
  try {
    await setDoc(doc(db, 'themes', theme.id), sanitizeForFirestore(theme));
    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'THEME_SAVED',
      resource: `themes/${theme.id}`,
      metadata: { name: theme.name },
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `themes/${theme.id}`);
  }
}

// 5. Winning Patterns
export async function fetchWinningPatterns(): Promise<WinningPattern[]> {
  try {
    const snap = await getDocs(collection(db, 'winningPatterns'));
    const items: WinningPattern[] = [];
    snap.forEach(d => items.push(d.data() as WinningPattern));
    if (items.length === 0) return SYSTEM_PATTERNS;
    return items;
  } catch {
    return SYSTEM_PATTERNS;
  }
}

export async function saveWinningPattern(pattern: WinningPattern, actorEmail: string = 'admin'): Promise<void> {
  try {
    await setDoc(doc(db, 'winningPatterns', pattern.id), sanitizeForFirestore(pattern));
    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'PATTERN_SAVED',
      resource: `winningPatterns/${pattern.id}`,
      metadata: { name: pattern.name },
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `winningPatterns/${pattern.id}`);
  }
}

export async function deleteWinningPattern(patternId: string, actorEmail: string = 'admin'): Promise<void> {
  try {
    await deleteDoc(doc(db, 'winningPatterns', patternId));
    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'PATTERN_DELETED',
      resource: `winningPatterns/${patternId}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `winningPatterns/${patternId}`);
  }
}

// 6. Game Templates
export async function fetchGameTemplates(): Promise<GameConfig[]> {
  try {
    const snap = await getDocs(collection(db, 'gameTemplates'));
    const templates: GameConfig[] = [];
    snap.forEach(d => {
      const data = d.data() as GameConfig;
      templates.push({
        ...data,
        id: data.id || d.id,
      });
    });
    if (templates.length === 0) {
      return [{ ...DEFAULT_GAME_CONFIG, id: 'template_default_awareness' }];
    }
    return templates;
  } catch {
    return [{ ...DEFAULT_GAME_CONFIG, id: 'template_default_awareness' }];
  }
}

export async function saveGameTemplate(
  template: GameConfig,
  actorEmail: string = 'admin',
  previousTemplateId?: string
): Promise<void> {
  const cleanSlug = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom';
  const templateId = template.id || `template_${cleanSlug}`;
  try {
    if (previousTemplateId && previousTemplateId !== templateId) {
      await deleteDoc(doc(db, 'gameTemplates', previousTemplateId)).catch(() => {});
    }
    const payload: GameConfig = {
      ...template,
      id: templateId,
    };
    await setDoc(doc(db, 'gameTemplates', templateId), sanitizeForFirestore(payload));
    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'TEMPLATE_SAVED',
      resource: `gameTemplates/${templateId}`,
      metadata: { name: template.name },
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `gameTemplates/${templateId}`);
  }
}

export async function deleteGameTemplate(templateId: string, actorEmail: string = 'admin'): Promise<void> {
  try {
    await deleteDoc(doc(db, 'gameTemplates', templateId));
    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'TEMPLATE_DELETED',
      resource: `gameTemplates/${templateId}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `gameTemplates/${templateId}`);
  }
}

// 7. Reset Entire Database & Restore Default Factory Seed
export async function resetEntireDatabase(actorEmail: string = 'admin'): Promise<void> {
  try {
    const collectionsToClear = ['games', 'gameTemplates', 'content', 'questions', 'themes', 'winningPatterns'];
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      for (const docSnap of snap.docs) {
        if (colName === 'games') {
          // Also clear subcollections of each game
          for (const sub of ['players', 'draws', 'claims', 'events']) {
            const subSnap = await getDocs(collection(db, 'games', docSnap.id, sub));
            for (const subDoc of subSnap.docs) {
              await deleteDoc(doc(db, 'games', docSnap.id, sub, subDoc.id)).catch(() => {});
            }
          }
        }
        await deleteDoc(doc(db, colName, docSnap.id)).catch(() => {});
      }
    }

    // Re-seed factory defaults
    await seedInitialDataIfEmpty(true);

    await appendAuditLog({
      actorId: 'admin',
      actorEmail,
      action: 'DATABASE_FACTORY_RESET',
      resource: 'firestore/all_collections',
      metadata: { status: 'CLEAN_AND_RESEEDED' },
    });
  } catch (error) {
    console.error('Database reset error:', error);
    throw error;
  }
}

// Sidebar Navigation Visibility Configuration
export const ADMIN_SIDEBAR_ITEMS = [
  { path: '/admin/dashboard', label: 'SOC Dashboard', canHide: false },
  { path: '/admin/games', label: 'Active Games', canHide: true },
  { path: '/admin/games/create', label: 'Game Builder', canHide: true },
  { path: '/admin/hall-of-fame', label: 'Hall of Fame', canHide: true },
  { path: '/admin/content', label: 'Content CMS', canHide: true },
  { path: '/admin/questions', label: 'Questions Bank', canHide: true },
  { path: '/admin/patterns', label: 'Pattern Editor', canHide: true },
  { path: '/admin/themes', label: 'Theme Editor', canHide: true },
  { path: '/admin/templates', label: 'Game Templates', canHide: true },
  { path: '/admin/analytics', label: 'Analytics', canHide: true },
  { path: '/admin/audit', label: 'Audit Trail', canHide: true },
  { path: '/admin/settings', label: 'Security & System', canHide: false },
] as const;

export async function fetchHallOfFameEntries(limitCount: number = 100): Promise<HallOfFameEntry[]> {
  try {
    const q = query(collection(db, 'hallOfFame'), orderBy('wonAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const entries: HallOfFameEntry[] = [];
    snap.forEach((d) => entries.push(d.data() as HallOfFameEntry));

    // Also include any historical winners embedded in games documents that pre-dated the hallOfFame collection
    const gamesSnap = await getDocs(collection(db, 'games'));
    const seenKeys = new Set(entries.map((e) => `${e.gameId}_${e.playerId}_${e.wonAt}`));

    gamesSnap.forEach((gDoc) => {
      const g = gDoc.data() as LiveGame;
      if (Array.isArray(g.winners)) {
        g.winners.forEach((w, idx) => {
          const compositeKey = `${g.id}_${w.playerId}_${w.wonAt}`;
          if (!seenKeys.has(compositeKey)) {
            seenKeys.add(compositeKey);
            entries.push({
              id: `legacy_${g.id}_${idx}`,
              gameId: g.id,
              gamePin: g.pin,
              gameTitle: g.title,
              gameMode: g.configSnapshot?.mode || 'classic',
              roundNumber: g.roundNumber || 1,
              playerId: w.playerId,
              playerNickname: w.nickname,
              patternName: w.patternName,
              scoreAwarded: w.score,
              rank: w.rank || idx + 1,
              totalDrawsAtWin: g.drawCount || 0,
              wonAt: w.wonAt || g.createdAt,
            });
          }
        });
      }
    });

    entries.sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime());
    return entries;
  } catch (error) {
    console.warn('Hall of Fame read error:', error);
    return [];
  }
}

const HIDDEN_SIDEBAR_STORAGE_KEY = 'cyber_bingo_hidden_sidebar_paths';

export function getHiddenSidebarPaths(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_SIDEBAR_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setHiddenSidebarPaths(paths: string[]): void {
  try {
    localStorage.setItem(HIDDEN_SIDEBAR_STORAGE_KEY, JSON.stringify(paths));
    window.dispatchEvent(new CustomEvent('admin-sidebar-visibility-changed', { detail: paths }));
  } catch (err) {
    console.error('Failed to save sidebar visibility settings:', err);
  }
}

// 7. Seed Initial Data Automatically if Firestore is Empty
export async function seedInitialDataIfEmpty(forceSeed: boolean = false): Promise<void> {
  // Only attempt auto-seed if an authenticated admin user is signed in or manual forceSeed is requested
  if (!auth.currentUser && !forceSeed) return;
  try {
    const contentSnap = await getDocs(query(collection(db, 'content'), limit(1)));
    if (contentSnap.empty || forceSeed) {
      // Seed cybersecurity terms
      for (const t of SEED_CYBER_TERMS) {
        const id = `term_${t.term.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        await setDoc(doc(db, 'content', id), {
          ...t,
          id,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed questions
      for (let i = 0; i < SEED_QUESTIONS.length; i++) {
        const q = SEED_QUESTIONS[i];
        const id = `q_${i + 1}`;
        await setDoc(doc(db, 'questions', id), {
          ...q,
          id,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed system patterns
      for (const p of SYSTEM_PATTERNS) {
        await setDoc(doc(db, 'winningPatterns', p.id), {
          ...p,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed themes
      for (const th of DEFAULT_THEMES) {
        await setDoc(doc(db, 'themes', th.id), {
          ...th,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed default template
      await setDoc(doc(db, 'gameTemplates', 'template_default_awareness'), {
        ...DEFAULT_GAME_CONFIG,
        createdAt: new Date().toISOString(),
      });

      console.log('✅ Cyber Bingo seed dataset successfully populated into Firestore!');
    }
  } catch (err) {
    console.warn('Initial seed check skipped or completed:', err);
  }
}

// 8. Analytics Aggregation
export async function fetchAnalyticsSummary() {
  try {
    const gamesSnap = await getDocs(collection(db, 'games'));
    let totalGames = gamesSnap.size;
    let activeGames = 0;
    let completedGames = 0;
    let totalPlayers = 0;
    let totalWinners = 0;
    let totalDraws = 0;

    const patternFrequency: Record<string, number> = {};

    gamesSnap.forEach(d => {
      const g = d.data() as LiveGame;
      if (g.status === 'ACTIVE' || g.status === 'LOBBY' || g.status === 'STARTING') {
        activeGames++;
      } else if (g.status === 'FINISHED' || g.status === 'ROUND_COMPLETE') {
        completedGames++;
      }
      totalPlayers += (g.playerCount || 0);
      totalDraws += (g.drawCount || 0);
      if (g.winners && g.winners.length > 0) {
        totalWinners += g.winners.length;
        g.winners.forEach(w => {
          patternFrequency[w.patternName] = (patternFrequency[w.patternName] || 0) + 1;
        });
      }
    });

    return {
      totalGames,
      activeGames,
      completedGames,
      totalPlayers,
      totalWinners,
      totalDraws,
      patternFrequency,
    };
  } catch {
    return {
      totalGames: 0,
      activeGames: 0,
      completedGames: 0,
      totalPlayers: 0,
      totalWinners: 0,
      totalDraws: 0,
      patternFrequency: {},
    };
  }
}
