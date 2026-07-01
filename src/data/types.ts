export interface VocabCard {
  id: string;
  word: string;
  article: 'der' | 'die' | 'das';
  plural: string;
  english: string;
  topic: string;
  genderRule?: string;
}

export type GrammarCategory =
  | 'artikel-kasus'
  | 'verb-konjugation'
  | 'trennbare-verben'
  | 'modalverben'
  | 'negation'
  | 'possessivpronomen'
  | 'personalpronomen'
  | 'perfekt'
  | 'praepositionen'
  | 'imperativ'
  | 'komparativ';

export interface GrammarCard {
  id: string;
  sentence: string;
  options: string[];
  correct: number;
  category: GrammarCategory;
  explanation: string;
  gender?: 'der' | 'die' | 'das';
  translation: string;
  rule: string;
}

export type CardType = 'vocab' | 'grammar' | 'uebungen';

export interface CardState {
  cardId: string;
  cardType: CardType;
  box: number;
  nextReview: string;
  lastReviewed: string | null;
  correctCount: number;
  wrongCount: number;
}

export interface DailyStats {
  date: string;
  newCardsShown: number;
  reviewsDone: number;
  correctCount: number;
}

export interface Progress {
  vocabLearned: number;
  vocabSeen: number;
  vocabTotal: number;
  grammarLearned: number;
  grammarSeen: number;
  grammarTotal: number;
  uebungenLearned: number;
  uebungenSeen: number;
  uebungenTotal: number;
  boxDistribution: number[];
  streak: number;
  readiness: number;
}

export type Article = 'der' | 'die' | 'das' | 'plural';

export interface PerfektCard {
  id: string;
  type: 'perfekt';
  sentence: string;
  auxiliaryOptions: string[];
  correctAuxiliary: number;
  participleOptions: string[];
  correctParticiple: number;
  translation: string;
  explanation: string;
  rule: string;
}

export interface PluralCard {
  id: string;
  type: 'plural';
  word: string;
  article: 'der' | 'die' | 'das';
  options: string[];
  correct: number;
  translation: string;
  rule: string;
}

export interface ConjugationCard {
  id: string;
  type: 'conjugation';
  sentence: string;
  hint: string;
  answer: string;
  translation: string;
  explanation: string;
  rule: string;
}

export interface SentenceCard {
  id: string;
  type: 'sentence';
  chunks: string[];
  translation: string;
  rule: string;
  punctuation?: string;
}

export type AnyGrammarCard = GrammarCard | PerfektCard | PluralCard | ConjugationCard | SentenceCard;
