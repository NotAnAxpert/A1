import { Platform } from 'react-native';
import type { CardType, CardState, Progress } from '../data/types';

const BOX_INTERVALS = [0, 0, 1, 3, 7, 21];

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// --- localStorage web storage ---

interface StoredCard {
  cardId: string;
  cardType: CardType;
  box: number;
  nextReview: string;
  lastReviewed: string | null;
  correctCount: number;
  wrongCount: number;
}

interface StoredStats {
  date: string;
  cardType: CardType;
  newCardsShown: number;
  reviewsDone: number;
  correctCount: number;
}

function loadCards(): StoredCard[] {
  try {
    const raw = localStorage.getItem('pruefung_cards');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCards(cards: StoredCard[]): void {
  localStorage.setItem('pruefung_cards', JSON.stringify(cards));
}

function loadStats(): StoredStats[] {
  try {
    const raw = localStorage.getItem('pruefung_stats');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveStats(stats: StoredStats[]): void {
  localStorage.setItem('pruefung_stats', JSON.stringify(stats));
}

// --- SQLite for native ---

let sqliteDb: any = null;

async function getSqliteDb() {
  if (sqliteDb) return sqliteDb;
  const SQLite = require('expo-sqlite');
  sqliteDb = await SQLite.openDatabaseAsync('pruefung.db');
  await sqliteDb.execAsync(`
    CREATE TABLE IF NOT EXISTS card_state (
      card_id TEXT NOT NULL,
      card_type TEXT NOT NULL,
      box INTEGER NOT NULL DEFAULT 1,
      next_review TEXT NOT NULL,
      last_reviewed TEXT,
      correct_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (card_id, card_type)
    );
    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT NOT NULL,
      card_type TEXT NOT NULL,
      new_cards_shown INTEGER NOT NULL DEFAULT 0,
      reviews_done INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (date, card_type)
    );
  `);
  return sqliteDb;
}

const isWeb = Platform.OS === 'web';

// --- Public API ---

export async function getDueCards(cardType: CardType): Promise<CardState[]> {
  if (isWeb) {
    const today = getToday();
    return loadCards()
      .filter((c) => c.cardType === cardType && c.nextReview <= today)
      .sort((a, b) => a.box - b.box || a.nextReview.localeCompare(b.nextReview))
      .map(storedToState);
  }
  const db = await getSqliteDb();
  const today = getToday();
  const rows = await db.getAllAsync(
    `SELECT * FROM card_state WHERE card_type = ? AND next_review <= ? ORDER BY box ASC, next_review ASC`,
    [cardType, today]
  );
  return (rows as any[]).map(mapSqlRow);
}

export async function getNewCardsShownToday(cardType: CardType): Promise<number> {
  if (isWeb) {
    const today = getToday();
    const stat = loadStats().find((s) => s.date === today && s.cardType === cardType);
    return stat?.newCardsShown ?? 0;
  }
  const db = await getSqliteDb();
  const today = getToday();
  const row = await db.getFirstAsync(
    `SELECT new_cards_shown FROM daily_stats WHERE date = ? AND card_type = ?`,
    [today, cardType]
  );
  return (row as any)?.new_cards_shown ?? 0;
}

export async function getKnownCardIds(cardType: CardType): Promise<Set<string>> {
  if (isWeb) {
    return new Set(loadCards().filter((c) => c.cardType === cardType).map((c) => c.cardId));
  }
  const db = await getSqliteDb();
  const rows = await db.getAllAsync(
    `SELECT card_id FROM card_state WHERE card_type = ?`,
    [cardType]
  );
  return new Set((rows as any[]).map((r) => r.card_id));
}

export async function introduceCard(cardId: string, cardType: CardType): Promise<void> {
  const today = getToday();
  if (isWeb) {
    const cards = loadCards();
    if (!cards.some((c) => c.cardId === cardId && c.cardType === cardType)) {
      cards.push({ cardId, cardType, box: 1, nextReview: today, lastReviewed: null, correctCount: 0, wrongCount: 0 });
      saveCards(cards);
    }
    const stats = loadStats();
    const idx = stats.findIndex((s) => s.date === today && s.cardType === cardType);
    if (idx >= 0) {
      stats[idx].newCardsShown++;
    } else {
      stats.push({ date: today, cardType, newCardsShown: 1, reviewsDone: 0, correctCount: 0 });
    }
    saveStats(stats);
    return;
  }
  const db = await getSqliteDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO card_state (card_id, card_type, box, next_review) VALUES (?, ?, 1, ?)`,
    [cardId, cardType, today]
  );
  await db.runAsync(
    `INSERT INTO daily_stats (date, card_type, new_cards_shown, reviews_done, correct_count)
     VALUES (?, ?, 1, 0, 0)
     ON CONFLICT(date, card_type) DO UPDATE SET new_cards_shown = new_cards_shown + 1`,
    [today, cardType]
  );
}

export async function updateCardAfterAnswer(
  cardId: string,
  cardType: CardType,
  correct: boolean
): Promise<void> {
  const today = getToday();

  if (isWeb) {
    const cards = loadCards();
    const card = cards.find((c) => c.cardId === cardId && c.cardType === cardType);
    if (card) {
      if (correct) {
        card.box = Math.min(card.box + 1, 5);
        card.correctCount++;
        const interval = BOX_INTERVALS[card.box] ?? 21;
        card.nextReview = addDays(today, interval);
      } else {
        card.box = 1;
        card.nextReview = today;
        card.wrongCount++;
      }
      card.lastReviewed = today;
      saveCards(cards);
    }
    const stats = loadStats();
    const idx = stats.findIndex((s) => s.date === today && s.cardType === cardType);
    if (idx >= 0) {
      stats[idx].reviewsDone++;
      if (correct) stats[idx].correctCount++;
    } else {
      stats.push({ date: today, cardType, newCardsShown: 0, reviewsDone: 1, correctCount: correct ? 1 : 0 });
    }
    saveStats(stats);
    return;
  }

  const db = await getSqliteDb();
  if (correct) {
    await db.runAsync(
      `UPDATE card_state SET box = MIN(box + 1, 5), last_reviewed = ?, correct_count = correct_count + 1 WHERE card_id = ? AND card_type = ?`,
      [today, cardId, cardType]
    );
    const row = await db.getFirstAsync(
      `SELECT box FROM card_state WHERE card_id = ? AND card_type = ?`,
      [cardId, cardType]
    );
    if (row) {
      const interval = BOX_INTERVALS[(row as any).box] ?? 21;
      await db.runAsync(
        `UPDATE card_state SET next_review = date(?, '+' || ? || ' days') WHERE card_id = ? AND card_type = ?`,
        [today, interval.toString(), cardId, cardType]
      );
    }
  } else {
    await db.runAsync(
      `UPDATE card_state SET box = 1, next_review = ?, last_reviewed = ?, wrong_count = wrong_count + 1 WHERE card_id = ? AND card_type = ?`,
      [today, today, cardId, cardType]
    );
  }
  await db.runAsync(
    `INSERT INTO daily_stats (date, card_type, new_cards_shown, reviews_done, correct_count)
     VALUES (?, ?, 0, 1, ?)
     ON CONFLICT(date, card_type) DO UPDATE SET reviews_done = reviews_done + 1, correct_count = correct_count + ?`,
    [today, cardType, correct ? 1 : 0, correct ? 1 : 0]
  );
}

export async function getProgress(): Promise<Progress> {
  if (isWeb) {
    const cards = loadCards();
    const vocabCards = cards.filter((c) => c.cardType === 'vocab');
    const grammarCards = cards.filter((c) => c.cardType === 'grammar');
    const uebungenCards = cards.filter((c) => c.cardType === 'uebungen');
    const boxes = [0, 0, 0, 0, 0];
    for (const c of cards) {
      if (c.box >= 1 && c.box <= 5) boxes[c.box - 1]++;
    }
    const vocabLearned = vocabCards.filter((c) => c.box >= 3).length;
    const grammarLearned = grammarCards.filter((c) => c.box >= 3).length;
    const uebungenLearned = uebungenCards.filter((c) => c.box >= 3).length;
    const vocabSeen = vocabCards.filter((c) => c.lastReviewed !== null).length;
    const grammarSeen = grammarCards.filter((c) => c.lastReviewed !== null).length;
    const uebungenSeen = uebungenCards.filter((c) => c.lastReviewed !== null).length;
    const totalSeen = vocabSeen + grammarSeen + uebungenSeen;
    const totalCards = cards.length;
    const readiness = totalCards > 0 ? Math.round((totalSeen / totalCards) * 100) : 0;
    return {
      vocabLearned,
      vocabSeen,
      vocabTotal: vocabCards.length,
      grammarLearned,
      grammarSeen,
      grammarTotal: grammarCards.length,
      uebungenLearned,
      uebungenSeen,
      uebungenTotal: uebungenCards.length,
      boxDistribution: boxes,
      streak: await getStreak(),
      readiness,
    };
  }

  const db = await getSqliteDb();
  const vocabTotal = await db.getFirstAsync(`SELECT COUNT(*) as count FROM card_state WHERE card_type = 'vocab'`);
  const vocabLearned = await db.getFirstAsync(`SELECT COUNT(*) as count FROM card_state WHERE card_type = 'vocab' AND box >= 3`);
  const vocabSeenRow = await db.getFirstAsync(`SELECT COUNT(*) as count FROM card_state WHERE card_type = 'vocab' AND last_reviewed IS NOT NULL`);
  const grammarTotal = await db.getFirstAsync(`SELECT COUNT(*) as count FROM card_state WHERE card_type = 'grammar'`);
  const grammarLearned = await db.getFirstAsync(`SELECT COUNT(*) as count FROM card_state WHERE card_type = 'grammar' AND box >= 3`);
  const grammarSeenRow = await db.getFirstAsync(`SELECT COUNT(*) as count FROM card_state WHERE card_type = 'grammar' AND last_reviewed IS NOT NULL`);
  const uebungenTotal = await db.getFirstAsync(`SELECT COUNT(*) as count FROM card_state WHERE card_type = 'uebungen'`);
  const uebungenLearned = await db.getFirstAsync(`SELECT COUNT(*) as count FROM card_state WHERE card_type = 'uebungen' AND box >= 3`);
  const uebungenSeenRow = await db.getFirstAsync(`SELECT COUNT(*) as count FROM card_state WHERE card_type = 'uebungen' AND last_reviewed IS NOT NULL`);
  const boxes = [0, 0, 0, 0, 0];
  const boxRows = await db.getAllAsync(`SELECT box, COUNT(*) as count FROM card_state GROUP BY box`);
  for (const row of boxRows as any[]) {
    if (row.box >= 1 && row.box <= 5) boxes[row.box - 1] = row.count;
  }
  const streak = await getStreak();
  const vSeen = (vocabSeenRow as any)?.count ?? 0;
  const gSeen = (grammarSeenRow as any)?.count ?? 0;
  const uSeen = (uebungenSeenRow as any)?.count ?? 0;
  const totalSeen = vSeen + gSeen + uSeen;
  const total = ((vocabTotal as any)?.count ?? 0) + ((grammarTotal as any)?.count ?? 0) + ((uebungenTotal as any)?.count ?? 0);
  return {
    vocabLearned: (vocabLearned as any)?.count ?? 0,
    vocabSeen: vSeen,
    vocabTotal: (vocabTotal as any)?.count ?? 0,
    grammarLearned: (grammarLearned as any)?.count ?? 0,
    grammarSeen: gSeen,
    grammarTotal: (grammarTotal as any)?.count ?? 0,
    uebungenLearned: (uebungenLearned as any)?.count ?? 0,
    uebungenSeen: uSeen,
    uebungenTotal: (uebungenTotal as any)?.count ?? 0,
    boxDistribution: boxes,
    streak,
    readiness: total > 0 ? Math.round((totalSeen / total) * 100) : 0,
  };
}

export async function getStreak(): Promise<number> {
  if (isWeb) {
    const stats = loadStats().filter((s) => s.reviewsDone > 0);
    const dates = [...new Set(stats.map((s) => s.date))].sort().reverse();
    if (dates.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
      if (dates[i] === expectedStr) {
        streak++;
      } else if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        if (dates[i] === yStr) { streak++; } else { break; }
      } else { break; }
    }
    return streak;
  }

  const db = await getSqliteDb();
  const rows = await db.getAllAsync(
    `SELECT DISTINCT date FROM daily_stats WHERE reviews_done > 0 ORDER BY date DESC LIMIT 60`
  );
  if ((rows as any[]).length === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < (rows as any[]).length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
    if ((rows as any[])[i].date === expectedStr) {
      streak++;
    } else if (i === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      if ((rows as any[])[i].date === yStr) { streak++; } else { break; }
    } else { break; }
  }
  return streak;
}

export async function getDueCount(cardType: CardType): Promise<number> {
  if (isWeb) {
    const today = getToday();
    return loadCards().filter((c) => c.cardType === cardType && c.nextReview <= today).length;
  }
  const db = await getSqliteDb();
  const today = getToday();
  const row = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM card_state WHERE card_type = ? AND next_review <= ?`,
    [cardType, today]
  );
  return (row as any)?.count ?? 0;
}

export async function getExtraReviewCards(
  cardType: CardType,
  excludeIds: Set<string>,
  limit: number
): Promise<CardState[]> {
  if (limit <= 0) return [];
  if (isWeb) {
    const today = getToday();
    return loadCards()
      .filter((c) => c.cardType === cardType && c.nextReview > today && !excludeIds.has(c.cardId))
      .sort((a, b) => a.box - b.box || a.nextReview.localeCompare(b.nextReview))
      .slice(0, limit)
      .map(storedToState);
  }
  const db = await getSqliteDb();
  const today = getToday();
  const rows = await db.getAllAsync(
    `SELECT * FROM card_state WHERE card_type = ? AND next_review > ? ORDER BY box ASC, next_review ASC`,
    [cardType, today]
  );
  return (rows as any[]).filter((r) => !excludeIds.has(r.card_id)).slice(0, limit).map(mapSqlRow);
}

// --- helpers ---

function storedToState(c: StoredCard): CardState {
  return { cardId: c.cardId, cardType: c.cardType, box: c.box, nextReview: c.nextReview, lastReviewed: c.lastReviewed, correctCount: c.correctCount, wrongCount: c.wrongCount };
}

function mapSqlRow(row: any): CardState {
  return { cardId: row.card_id, cardType: row.card_type, box: row.box, nextReview: row.next_review, lastReviewed: row.last_reviewed, correctCount: row.correct_count, wrongCount: row.wrong_count };
}

// keep for compatibility
export async function getDatabase() { return getSqliteDb(); }
