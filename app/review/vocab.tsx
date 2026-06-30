import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import ReviewSession from '../../src/components/ReviewSession';
import { getDueCards, getNewCardsShownToday, getKnownCardIds, introduceCard, getExtraReviewCards } from '../../src/db/database';
import type { VocabCard } from '../../src/data/types';
import { colors } from '../../src/theme';
import allVocab from '../../src/data/vocab.json';

const NEW_CARDS_PER_DAY = 10;
const MIN_SESSION_SIZE = 15;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VocabReviewScreen() {
  const [cards, setCards] = useState<VocabCard[] | null>(null);
  const [boxMap, setBoxMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      const dueStates = await getDueCards('vocab');
      const knownIds = await getKnownCardIds('vocab');
      const newShownToday = await getNewCardsShownToday('vocab');

      const boxes = new Map<string, number>();
      for (const s of dueStates) boxes.set(s.cardId, s.box);

      const dueCards = dueStates
        .map((state) => (allVocab as VocabCard[]).find((v) => v.id === state.cardId))
        .filter(Boolean) as VocabCard[];

      const newLimit = Math.max(0, NEW_CARDS_PER_DAY - newShownToday);
      const shuffledAll = shuffle(allVocab as VocabCard[]);
      const newCards: VocabCard[] = [];
      for (const v of shuffledAll) {
        if (newCards.length >= newLimit) break;
        if (!knownIds.has(v.id)) {
          await introduceCard(v.id, 'vocab');
          boxes.set(v.id, 1);
          newCards.push(v);
        }
      }

      let sessionCards = [...dueCards, ...newCards];
      const sessionIds = new Set(sessionCards.map((c) => c.id));

      if (sessionCards.length < MIN_SESSION_SIZE) {
        const extraNeeded = MIN_SESSION_SIZE - sessionCards.length;
        const extraStates = await getExtraReviewCards('vocab', sessionIds, extraNeeded);
        const extraCards = extraStates
          .map((state) => (allVocab as VocabCard[]).find((v) => v.id === state.cardId))
          .filter(Boolean) as VocabCard[];
        for (const s of extraStates) boxes.set(s.cardId, s.box);
        sessionCards = [...sessionCards, ...extraCards];
      }

      setBoxMap(boxes);
      setCards(shuffle(sessionCards));
    } catch {
      const shuffled = shuffle(allVocab as VocabCard[]).slice(0, MIN_SESSION_SIZE);
      const boxes = new Map<string, number>();
      for (const v of shuffled) boxes.set(v.id, 1);
      setBoxMap(boxes);
      setCards(shuffled);
    }
  }

  if (cards === null) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ title: 'Wortschatz' }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Wortschatz' }} />
      <ReviewSession cards={cards} cardType="vocab" title="Der / Die / Das" boxMap={boxMap} />
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
