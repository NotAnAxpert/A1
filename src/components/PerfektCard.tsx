import { useState, useEffect, useRef } from 'react';
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

interface BlankResult {
  selected: number;
  correct: boolean;
}

export default function PerfektCard({ card, onAnswer }: Props) {
  const [activeBlank, setActiveBlank] = useState<'aux' | 'part'>('aux');
  const [auxResult, setAuxResult] = useState<BlankResult | null>(null);
  const [partResult, setPartResult] = useState<BlankResult | null>(null);
  const answeredRef = useRef(false);

  const bothResolved = auxResult !== null && partResult !== null;

  useEffect(() => {
    if (bothResolved && !answeredRef.current) {
      answeredRef.current = true;
      const allCorrect = auxResult.correct && partResult.correct;
      onAnswer(allCorrect);
      Speech.stop();
      const fullSentence = card.sentence
        .replace('___', card.auxiliaryOptions[card.correctAuxiliary])
        .replace('___', card.participleOptions[card.correctParticiple]);
      setTimeout(() => {
        Speech.speak(fullSentence, { language: 'de', rate: 1.1 });
      }, 150);
    }
  }, [bothResolved]);

  function handleBlankTap(blank: 'aux' | 'part') {
    if (blank === 'aux' && auxResult !== null) return;
    if (blank === 'part' && partResult !== null) return;
    setActiveBlank(blank);
  }

  function handleOptionSelect(index: number) {
    if (activeBlank === 'aux') {
      if (auxResult !== null) return;
      const correct = index === card.correctAuxiliary;
      setAuxResult({ selected: index, correct });
      if (partResult === null) {
        setTimeout(() => setActiveBlank('part'), 400);
      }
    } else {
      if (partResult !== null) return;
      const correct = index === card.correctParticiple;
      setPartResult({ selected: index, correct });
      if (auxResult === null) {
        setTimeout(() => setActiveBlank('aux'), 400);
      }
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < 4) {
        e.preventDefault();
        handleOptionSelect(idx);
      }
    }
    if (typeof window !== 'undefined' && !bothResolved) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [activeBlank, auxResult, partResult, bothResolved]);

  function speakSentence() {
    Speech.stop();
    const fullSentence = card.sentence
      .replace('___', card.auxiliaryOptions[card.correctAuxiliary])
      .replace('___', card.participleOptions[card.correctParticiple]);
    Speech.speak(fullSentence, { language: 'de', rate: 0.9 });
  }

  const parts = card.sentence.split('___');

  const activeOptions = activeBlank === 'aux' ? card.auxiliaryOptions : card.participleOptions;
  const activeCorrectIdx = activeBlank === 'aux' ? card.correctAuxiliary : card.correctParticiple;
  const activeResult = activeBlank === 'aux' ? auxResult : partResult;
  const activeLabel = activeBlank === 'aux' ? 'Hilfsverb' : 'Partizip II';

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
            <Pressable
              onPress={() => handleBlankTap('aux')}
              style={[
                styles.blankPill,
                auxResult
                  ? auxResult.correct ? styles.blankPillCorrect : styles.blankPillWrong
                  : activeBlank === 'aux'
                    ? styles.blankPillActive
                    : styles.blankPillInactive,
              ]}
            >
              <Text style={[
                styles.blankPillText,
                auxResult
                  ? auxResult.correct ? styles.blankTextCorrect : styles.blankTextWrong
                  : activeBlank === 'aux'
                    ? styles.blankTextActive
                    : styles.blankTextInactive,
              ]}>
                {auxResult
                  ? card.auxiliaryOptions[card.correctAuxiliary]
                  : '________'}
              </Text>
              {!auxResult && activeBlank === 'aux' && (
                <Text style={styles.blankLabel}>Hilfsverb</Text>
              )}
            </Pressable>
            {parts[1].trim() !== '' && (
              <Text style={styles.sentenceWord}>{parts[1].trim()}</Text>
            )}
            <Pressable
              onPress={() => handleBlankTap('part')}
              style={[
                styles.blankPill,
                partResult
                  ? partResult.correct ? styles.blankPillCorrect : styles.blankPillWrong
                  : activeBlank === 'part'
                    ? styles.blankPillActive
                    : styles.blankPillInactive,
              ]}
            >
              <Text style={[
                styles.blankPillText,
                partResult
                  ? partResult.correct ? styles.blankTextCorrect : styles.blankTextWrong
                  : activeBlank === 'part'
                    ? styles.blankTextActive
                    : styles.blankTextInactive,
              ]}>
                {partResult
                  ? card.participleOptions[card.correctParticiple]
                  : '________'}
              </Text>
              {!partResult && activeBlank === 'part' && (
                <Text style={styles.blankLabel}>Partizip II</Text>
              )}
            </Pressable>
            {(parts[2] ?? '').trim() !== '' && (
              <Text style={styles.sentenceWord}>{(parts[2] ?? '').trim()}</Text>
            )}
          </View>
        </View>
      </View>

      {!bothResolved && (
        <View style={styles.optionGroup}>
          <Text style={styles.groupLabel}>{activeLabel}</Text>
          <View style={styles.options}>
            {activeOptions.map((option, index) => {
              const isCorrect = index === activeCorrectIdx;
              const isSelected = index === activeResult?.selected;
              const locked = activeResult !== null;

              let rowStyle: ViewStyle[] = [styles.option];
              let letterStyle: ViewStyle[] = [styles.letterCircle];
              let labelColor = colors.text;

              if (!locked) {
                // default
              } else if (isCorrect) {
                rowStyle = [styles.option, { backgroundColor: colors.successLight, borderColor: colors.success }];
                letterStyle = [styles.letterCircle, { backgroundColor: colors.success, borderColor: colors.success }];
                labelColor = colors.success;
              } else if (isSelected && !isCorrect) {
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
                  onPress={() => handleOptionSelect(index)}
                  disabled={locked}
                >
                  <View style={letterStyle}>
                    <Text style={[
                      styles.letterText,
                      locked && (isCorrect || (isSelected && !isCorrect)) && { color: '#FFFFFF' },
                    ]}>
                      {LETTERS[index]}
                    </Text>
                  </View>
                  <Text style={[styles.optionLabel, { color: labelColor }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {bothResolved && (
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
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
    borderStyle: 'solid',
  },
  blankPillInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
  },
  blankPillCorrect: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
    borderStyle: 'solid',
  },
  blankPillWrong: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
    borderStyle: 'solid',
  },
  blankPillText: {
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 28,
  },
  blankTextActive: {
    color: colors.primary,
  },
  blankTextInactive: {
    color: colors.textMuted,
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
