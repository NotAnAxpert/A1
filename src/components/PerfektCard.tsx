import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../theme';
import type { PerfektCard as PerfektCardType } from '../data/types';

const LETTERS = ['1', '2', '3', '4'];

interface Props {
  card: PerfektCardType;
  onAnswer: (correct: boolean) => void;
}

export default function PerfektCard({ card, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === card.correctAuxiliary;

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    onAnswer(index === card.correctAuxiliary);
    Speech.stop();
    const fullSentence = card.sentence
      .replace('___', card.auxiliaryOptions[card.correctAuxiliary])
      .replace('___', card.participleOptions[card.correctParticiple]);
    setTimeout(() => {
      Speech.speak(fullSentence, { language: 'de', rate: 1.1 });
    }, 150);
  }

  function speakSentence() {
    Speech.stop();
    const fullSentence = card.sentence
      .replace('___', card.auxiliaryOptions[card.correctAuxiliary])
      .replace('___', card.participleOptions[card.correctParticiple]);
    Speech.speak(fullSentence, { language: 'de', rate: 0.9 });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < card.auxiliaryOptions.length) {
        e.preventDefault();
        handleSelect(idx);
      }
    }
    if (typeof window !== 'undefined' && !answered) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [answered, card]);

  const parts = card.sentence.split('___');
  const participle = card.participleOptions[card.correctParticiple];

  return (
    <View style={styles.container}>
      <View style={styles.questionSection}>
        <View style={[styles.categoryChip, { backgroundColor: colors.accent2 + '1A' }]}>
          <Text style={[styles.categoryText, { color: colors.accent2 }]}>PERFEKT</Text>
        </View>

        <View style={styles.sentenceCard}>
          <View style={styles.sentenceRow}>
            {parts[0].trim() !== '' && (
              <Text style={styles.sentenceWord}>{parts[0].trim()}</Text>
            )}
            <View style={[
              styles.blankPill,
              answered
                ? isCorrect ? styles.blankPillCorrect : styles.blankPillWrong
                : styles.blankPillActive,
            ]}>
              <Text style={[
                styles.blankPillText,
                answered
                  ? isCorrect ? styles.blankTextCorrect : styles.blankTextWrong
                  : styles.blankTextActive,
              ]}>
                {answered ? card.auxiliaryOptions[card.correctAuxiliary] : '________'}
              </Text>
              {!answered && (
                <Text style={styles.blankLabel}>Hilfsverb</Text>
              )}
            </View>
            {parts[1].trim() !== '' && (
              <Text style={styles.sentenceWord}>{parts[1].trim()}</Text>
            )}
            <View style={styles.participlePill}>
              <Text style={styles.participleText}>{participle}</Text>
              <Text style={styles.participleLabel}>Partizip II</Text>
            </View>
            {(parts[2] ?? '').trim() !== '' && (
              <Text style={styles.sentenceWord}>{(parts[2] ?? '').trim()}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.optionGroup}>
        <Text style={styles.groupLabel}>Hilfsverb</Text>
        <View style={styles.options}>
          {card.auxiliaryOptions.map((option, index) => {
            const optionIsCorrect = index === card.correctAuxiliary;
            const isSelected = index === selected;

            let rowStyle: ViewStyle[] = [styles.option];
            let letterStyle: ViewStyle[] = [styles.letterCircle];
            let labelColor = colors.text;

            if (!answered) {
              // default
            } else if (optionIsCorrect) {
              rowStyle = [styles.option, { backgroundColor: colors.successLight, borderColor: colors.success }];
              letterStyle = [styles.letterCircle, { backgroundColor: colors.success, borderColor: colors.success }];
              labelColor = colors.success;
            } else if (isSelected && !optionIsCorrect) {
              rowStyle = [styles.option, { backgroundColor: colors.errorLight, borderColor: colors.error }];
              letterStyle = [styles.letterCircle, { backgroundColor: colors.error, borderColor: colors.error }];
              labelColor = colors.error;
            } else {
              rowStyle = [styles.option, { opacity: 0.4 }];
            }

            return (
              <Pressable
                key={index}
                style={rowStyle}
                onPress={() => handleSelect(index)}
                disabled={answered}
              >
                <View style={letterStyle}>
                  <Text style={[
                    styles.letterText,
                    answered && (optionIsCorrect || (isSelected && !optionIsCorrect)) && { color: '#FFFFFF' },
                  ]}>
                    {LETTERS[index]}
                  </Text>
                </View>
                <Text style={[styles.optionLabel, { color: labelColor }]}>
                  {option}
                </Text>
                {answered && isSelected && !optionIsCorrect && (
                  <Text style={styles.yourPickLabel}>Your pick</Text>
                )}
                {answered && optionIsCorrect && (
                  <Text style={styles.correctLabel}>Correct</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {answered && (
        <View style={styles.explanation}>
          <Text style={styles.translationText}>{card.translation}</Text>
          <Text style={styles.ruleText}>{card.rule}</Text>
          <Pressable style={styles.listenButton} onPress={speakSentence} hitSlop={8}>
            <Ionicons name="volume-medium" size={16} color={colors.primary} />
            <Text style={styles.listenText}>Listen</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  questionSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 1.5,
  },
  sentenceCard: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    width: '100%',
  },
  sentenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sentenceWord: {
    fontSize: fontSize.xl,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.text,
    lineHeight: 38,
  },
  blankPill: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 2,
    minWidth: 90,
  },
  blankPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  blankPillCorrect: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  blankPillWrong: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  blankPillText: {
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 28,
  },
  blankTextActive: {
    color: colors.primary,
  },
  blankTextCorrect: {
    color: colors.success,
  },
  blankTextWrong: {
    color: colors.error,
  },
  blankLabel: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  participlePill: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.accent2,
    backgroundColor: colors.accent2 + '14',
    minWidth: 90,
  },
  participleText: {
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.accent2,
    lineHeight: 28,
  },
  participleLabel: {
    fontSize: 9,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.accent2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  optionGroup: {
    marginBottom: spacing.md,
  },
  groupLabel: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSolid,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  letterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  letterText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textSecondary,
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_700Bold',
    flex: 1,
  },
  yourPickLabel: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.error,
  },
  correctLabel: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.success,
  },
  explanation: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  translationText: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  ruleText: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  listenText: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.primary,
  },
});
