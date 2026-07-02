import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import ReviewSession from '../../src/components/ReviewSession';
import { getDueCards, getNewCardsShownToday, getKnownCardIds, introduceCard, getExtraReviewCards } from '../../src/db/database';
import type { AnyGrammarCard } from '../../src/data/types';
import { colors } from '../../src/theme';
import perfektData from '../../src/data/perfekt.json';
import pluralData from '../../src/data/plural.json';
import conjugationData from '../../src/data/conjugation.json';
import sentenceData from '../../src/data/sentences.json';
import trennbareData from '../../src/data/trennbare.json';
import welcherData from '../../src/data/welcher.json';

const allExercises: AnyGrammarCard[] = [
  ...(perfektData as AnyGrammarCard[]),
  ...(pluralData as AnyGrammarCard[]),
  ...(conjugationData as AnyGrammarCard[]),
  ...(sentenceData as AnyGrammarCard[]),
  ...(trennbareData as AnyGrammarCard[]),
  ...(welcherData as AnyGrammarCard[]),
];

const NEW_CARDS_PER_DAY = 20;
const MIN_SESSION_SIZE = 15;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function UebungenReviewScreen() {
  const [cards, setCards] = useState<AnyGrammarCard[] | null>(null);
  const [boxMap, setBoxMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      const dueStates = await getDueCards('uebungen');
      const knownIds = await getKnownCardIds('uebungen');
      const newShownToday = await getNewCardsShownToday('uebungen');

      const boxes = new Map<string, number>();
      for (const s of dueStates) boxes.set(s.cardId, s.box);

      const dueCards = dueStates
        .map((state) => allExercises.find((g) => g.id === state.cardId))
        .filter(Boolean) as AnyGrammarCard[];

      const newLimit = Math.max(0, NEW_CARDS_PER_DAY - newShownToday);
      const shuffledAll = shuffle(allExercises);
      const newCards: AnyGrammarCard[] = [];
      for (const g of shuffledAll) {
        if (newCards.length >= newLimit) break;
        if (!knownIds.has(g.id)) {
          await introduceCard(g.id, 'uebungen');
          boxes.set(g.id, 1);
          newCards.push(g);
        }
      }

      let sessionCards = [...dueCards, ...newCards];
      const sessionIds = new Set(sessionCards.map((c) => c.id));

      if (sessionCards.length < MIN_SESSION_SIZE) {
        const extraNeeded = MIN_SESSION_SIZE - sessionCards.length;
        const extraStates = await getExtraReviewCards('uebungen', sessionIds, extraNeeded);
        const extraCards = extraStates
          .map((state) => allExercises.find((g) => g.id === state.cardId))
          .filter(Boolean) as AnyGrammarCard[];
        for (const s of extraStates) boxes.set(s.cardId, s.box);
        sessionCards = [...sessionCards, ...extraCards];
      }

      if (sessionCards.length < MIN_SESSION_SIZE) {
        const currentIds = new Set(sessionCards.map((c) => c.id));
        const moreUnseen = shuffle(allExercises).filter(
          (g) => !knownIds.has(g.id) && !currentIds.has(g.id)
        );
        for (const g of moreUnseen.slice(0, MIN_SESSION_SIZE - sessionCards.length)) {
          await introduceCard(g.id, 'uebungen');
          boxes.set(g.id, 1);
          sessionCards.push(g);
        }
      }

      setBoxMap(boxes);
      setCards(shuffle(sessionCards));
    } catch {
      const shuffled = shuffle(allExercises).slice(0, MIN_SESSION_SIZE);
      const boxes = new Map<string, number>();
      for (const g of shuffled) boxes.set(g.id, 1);
      setBoxMap(boxes);
      setCards(shuffled);
    }
  }

  if (cards === null) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ title: 'Übungen' }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Übungen' }} />
      <ReviewSession cards={cards} cardType="uebungen" title="A1 Übungen" boxMap={boxMap} />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
