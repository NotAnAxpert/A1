import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import ReviewSession from '../../src/components/ReviewSession';
import { getDueCards, getNewCardsShownToday, getKnownCardIds, introduceCard, getExtraReviewCards } from '../../src/db/database';
import type { GrammarCard } from '../../src/data/types';
import { colors } from '../../src/theme';
import allGrammar from '../../src/data/grammar.json';

const NEW_CARDS_PER_DAY = 15;
const MIN_SESSION_SIZE = 15;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GrammarReviewScreen() {
  const [cards, setCards] = useState<GrammarCard[] | null>(null);
  const [boxMap, setBoxMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      const dueStates = await getDueCards('grammar');
      const knownIds = await getKnownCardIds('grammar');
      const newShownToday = await getNewCardsShownToday('grammar');

      const boxes = new Map<string, number>();
      for (const s of dueStates) boxes.set(s.cardId, s.box);

      const dueCards = dueStates
        .map((state) => (allGrammar as GrammarCard[]).find((g) => g.id === state.cardId))
        .filter(Boolean) as GrammarCard[];

      const newLimit = Math.max(0, NEW_CARDS_PER_DAY - newShownToday);
      const shuffledAll = shuffle((allGrammar as GrammarCard[]));
      const newCards: GrammarCard[] = [];
      for (const g of shuffledAll) {
        if (newCards.length >= newLimit) break;
        if (!knownIds.has(g.id)) {
          await introduceCard(g.id, 'grammar');
          boxes.set(g.id, 1);
          newCards.push(g);
        }
      }

      let sessionCards = [...dueCards, ...newCards];
      const sessionIds = new Set(sessionCards.map((c) => c.id));

      if (sessionCards.length < MIN_SESSION_SIZE) {
        const extraNeeded = MIN_SESSION_SIZE - sessionCards.length;
        const extraStates = await getExtraReviewCards('grammar', sessionIds, extraNeeded);
        const extraCards = extraStates
          .map((state) => (allGrammar as GrammarCard[]).find((g) => g.id === state.cardId))
          .filter(Boolean) as GrammarCard[];
        for (const s of extraStates) boxes.set(s.cardId, s.box);
        sessionCards = [...sessionCards, ...extraCards];
      }

      if (sessionCards.length < MIN_SESSION_SIZE) {
        const currentIds = new Set(sessionCards.map((c) => c.id));
        const moreUnseen = shuffle(allGrammar as GrammarCard[]).filter(
          (g) => !knownIds.has(g.id) && !currentIds.has(g.id)
        );
        for (const g of moreUnseen.slice(0, MIN_SESSION_SIZE - sessionCards.length)) {
          await introduceCard(g.id, 'grammar');
          boxes.set(g.id, 1);
          sessionCards.push(g);
        }
      }

      setBoxMap(boxes);
      setCards(shuffle(sessionCards));
    } catch {
      const shuffled = shuffle((allGrammar as GrammarCard[])).slice(0, MIN_SESSION_SIZE);
      const boxes = new Map<string, number>();
      for (const g of shuffled) boxes.set(g.id, 1);
      setBoxMap(boxes);
      setCards(shuffled);
    }
  }

  if (cards === null) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ title: 'Grammatik' }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Grammatik' }} />
      <ReviewSession cards={cards} cardType="grammar" title="A1 Grammatik" boxMap={boxMap} />
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
