import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Animated } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, radius } from '../theme';

const isWeb = Platform.OS === 'web';
import type { VocabCard as VocabCardType, GrammarCard as GrammarCardType, CardType, PerfektCard as PerfektCardType, PluralCard as PluralCardType, ConjugationCard as ConjugationCardType, SentenceCard as SentenceCardType, TrennbareCard as TrennbareCardType, WelcherCard as WelcherCardType } from '../data/types';
import { updateCardAfterAnswer } from '../db/database';
import VocabCard from './VocabCard';
import GrammarCard from './GrammarCard';
import PerfektCardComponent from './PerfektCard';
import PluralCardComponent from './PluralCard';
import ConjugationCardComponent from './ConjugationCard';
import SentenceCardComponent from './SentenceCard';
import TrennbareCardComponent from './TrennbareCard';
import WelcherCardComponent from './WelcherCard';

type Card = VocabCardType | GrammarCardType | PerfektCardType | PluralCardType | ConjugationCardType | SentenceCardType | TrennbareCardType | WelcherCardType;

const BOX_INTERVALS = [0, 0, 1, 3, 7, 21];

function getSrsMessage(correct: boolean, currentBox: number): string {
  if (correct) {
    const newBox = Math.min(currentBox + 1, 5);
    const days = BOX_INTERVALS[newBox];
    if (days === 0) return 'Repeats again this session';
    if (days === 1) return 'Repeats tomorrow';
    return `Repeats in ${days} days`;
  }
  return 'Back to start — repeats again now';
}

interface Props {
  cards: Card[];
  cardType: CardType;
  title: string;
  boxMap?: Map<string, number>;
}

export default function ReviewSession({ cards, cardType, title, boxMap }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = isWeb ? Math.max(insets.bottom, 24) : insets.bottom;
  const [queue, setQueue] = useState<Card[]>([...cards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctIds, setCorrectIds] = useState<Set<string>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; srs: string } | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const bannerAnim = useRef(new Animated.Value(0)).current;

  const currentCard = queue[currentIndex];
  const originalTotal = cards.length;
  const correctCount = correctIds.size;

  useEffect(() => {
    if (waitingForNext) {
      bannerAnim.setValue(0);
      Animated.spring(bannerAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }
  }, [waitingForNext]);

  const handleAnswer = useCallback(
    async (correct: boolean) => {
      if (correct) {
        setCorrectIds((prev) => new Set(prev).add(currentCard.id));
      } else {
        setQueue((prev) => [...prev, currentCard]);
        setWrongIds((prev) => new Set(prev).add(currentCard.id));
      }

      try {
        if (correct) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch {}

      const currentBox = boxMap?.get(currentCard.id) ?? 1;
      const srs = getSrsMessage(correct, currentBox);
      setLastResult({ correct, srs });
      setWaitingForNext(true);

      try {
        await updateCardAfterAnswer(currentCard.id, cardType, correct);
      } catch {}
    },
    [currentCard, cardType, boxMap]
  );

  function handleNext() {
    if (!waitingForNext) return;
    setLastResult(null);
    setWaitingForNext(false);
    if (currentIndex + 1 >= queue.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    }
    if (typeof window !== 'undefined' && waitingForNext) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [waitingForNext, currentIndex]);

  if (originalTotal === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✧</Text>
          <Text style={styles.emptyTitle}>Alles erledigt!</Text>
          <Text style={styles.emptySubtitle}>No cards due. Come back later.</Text>
        </View>
        <Pressable style={[styles.backButton, { marginBottom: spacing.lg + bottomPad }]} onPress={() => router.replace('/')}>
          <Ionicons name="home" size={16} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  if (finished) {
    const wrongCount = wrongIds.size;
    const firstTryCount = originalTotal - wrongCount;
    const firstTryAccuracy = originalTotal > 0
      ? Math.round((firstTryCount / originalTotal) * 100)
      : 0;

    return (
      <View style={styles.container}>
        <View style={styles.doneContent}>
          <Text style={styles.doneEmoji}>✧</Text>
          <Text style={styles.doneAccuracy}>{firstTryAccuracy}%</Text>
          <Text style={styles.doneLabel}>First-try accuracy</Text>

          <View style={styles.doneStatsRow}>
            <View style={[styles.doneStat, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <Text style={[styles.doneStatValue, { color: colors.success }]}>{firstTryCount}</Text>
              <Text style={styles.doneStatLabel}>Correct</Text>
            </View>
            {wrongCount > 0 && (
              <View style={[styles.doneStat, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
                <Text style={[styles.doneStatValue, { color: colors.error }]}>{wrongCount}</Text>
                <Text style={styles.doneStatLabel}>Retry</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable style={[styles.backButton, { marginBottom: spacing.lg + bottomPad }]} onPress={() => router.replace('/')}>
          <Ionicons name="home" size={16} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  const progressPct = originalTotal > 0 ? (correctCount / originalTotal) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>{correctCount} / {originalTotal}</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} bounces={false}>
        {cardType === 'vocab' ? (
          <VocabCard
            key={`${currentCard.id}-${currentIndex}`}
            card={currentCard as VocabCardType}
            onAnswer={handleAnswer}
          />
        ) : (() => {
          const grammarType = (currentCard as any).type;
          switch (grammarType) {
            case 'perfekt':
              return <PerfektCardComponent key={`${currentCard.id}-${currentIndex}`} card={currentCard as PerfektCardType} onAnswer={handleAnswer} />;
            case 'plural':
              return <PluralCardComponent key={`${currentCard.id}-${currentIndex}`} card={currentCard as PluralCardType} onAnswer={handleAnswer} />;
            case 'conjugation':
              return <ConjugationCardComponent key={`${currentCard.id}-${currentIndex}`} card={currentCard as ConjugationCardType} onAnswer={handleAnswer} />;
            case 'sentence':
              return <SentenceCardComponent key={`${currentCard.id}-${currentIndex}`} card={currentCard as SentenceCardType} onAnswer={handleAnswer} />;
            case 'trennbare':
              return <TrennbareCardComponent key={`${currentCard.id}-${currentIndex}`} card={currentCard as TrennbareCardType} onAnswer={handleAnswer} />;
            case 'welcher':
              return <WelcherCardComponent key={`${currentCard.id}-${currentIndex}`} card={currentCard as WelcherCardType} onAnswer={handleAnswer} />;
            default:
              return <GrammarCard key={`${currentCard.id}-${currentIndex}`} card={currentCard as GrammarCardType} onAnswer={handleAnswer} />;
          }
        })()}
      </ScrollView>

      {waitingForNext && lastResult && (
        <Animated.View style={[
          styles.bottomBar,
          { paddingBottom: spacing.lg + bottomPad },
          {
            opacity: bannerAnim,
            transform: [{
              translateY: bannerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            }],
          },
        ]}>
          <Pressable
            style={[
              styles.nextButton,
              { backgroundColor: lastResult.correct ? colors.success : colors.error },
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextLabel}>
              {lastResult.correct ? 'Correct ✧' : 'Try again soon'}
            </Text>
            <View style={styles.nextRight}>
              <Text style={styles.nextButtonText}>
                {currentIndex + 1 >= queue.length ? 'Finish' : 'Next'}
              </Text>
              <View style={styles.enterHint}>
                <Text style={styles.enterHintText}>Enter ↵</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.text,
  },
  counterBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  counterText: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xxl,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  doneContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  doneEmoji: {
    fontSize: 48,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  doneAccuracy: {
    fontSize: 72,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.primary,
  },
  doneLabel: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  doneStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  doneStat: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  doneStatValue: {
    fontSize: fontSize.xxl,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  doneStatLabel: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  nextLabel: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  nextRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nextButtonText: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
  },
  enterHint: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  enterHintText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
