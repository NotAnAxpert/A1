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
  const [step, setStep] = useState<'participle' | 'auxiliary'>('participle');
  const [selectedParticiple, setSelectedParticiple] = useState<number | null>(null);
  const [selectedAuxiliary, setSelectedAuxiliary] = useState<number | null>(null);

  const participleAnswered = selectedParticiple !== null;
  const participleCorrect = selectedParticiple === card.correctParticiple;
  const auxiliaryAnswered = selectedAuxiliary !== null;
  const auxiliaryCorrect = selectedAuxiliary === card.correctAuxiliary;
  const fullyAnswered = participleAnswered && auxiliaryAnswered;

  function handleSelectParticiple(index: number) {
    if (participleAnswered) return;
    setSelectedParticiple(index);
    if (index === card.correctParticiple) {
      setTimeout(() => setStep('auxiliary'), 600);
    } else {
      setTimeout(() => setStep('auxiliary'), 1200);
    }
  }

  function handleSelectAuxiliary(index: number) {
    if (auxiliaryAnswered) return;
    setSelectedAuxiliary(index);
    const bothCorrect = participleCorrect && index === card.correctAuxiliary;
    onAnswer(bothCorrect);
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
      if (idx < 0 || idx > 3) return;
      e.preventDefault();
      if (step === 'participle' && !participleAnswered) {
        handleSelectParticiple(idx);
      } else if (step === 'auxiliary' && !auxiliaryAnswered) {
        handleSelectAuxiliary(idx);
      }
    }
    if (typeof window !== 'undefined' && !fullyAnswered) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [step, participleAnswered, auxiliaryAnswered, fullyAnswered, card]);

  const parts = card.sentence.split('___');

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
              step === 'auxiliary' || fullyAnswered
                ? auxiliaryAnswered
                  ? auxiliaryCorrect ? styles.blankPillCorrect : styles.blankPillWrong
                  : styles.blankPillActive
                : styles.blankPillInactive,
            ]}>
              <Text style={[
                styles.blankPillText,
                step === 'auxiliary' || fullyAnswered
                  ? auxiliaryAnswered
                    ? auxiliaryCorrect ? styles.blankTextCorrect : styles.blankTextWrong
                    : styles.blankTextActive
                  : styles.blankTextInactive,
              ]}>
                {auxiliaryAnswered ? card.auxiliaryOptions[card.correctAuxiliary] : '________'}
              </Text>
              {!auxiliaryAnswered && (
                <Text style={[styles.blankLabel, step !== 'auxiliary' && { color: colors.textMuted }]}>
                  Hilfsverb
                </Text>
              )}
            </View>

            {parts[1].trim() !== '' && (
              <Text style={styles.sentenceWord}>{parts[1].trim()}</Text>
            )}

            <View style={[
              styles.blankPill,
              step === 'participle' && !participleAnswered
                ? styles.blankPillActive
                : participleAnswered
                  ? participleCorrect ? styles.blankPillCorrect : styles.blankPillWrong
                  : styles.blankPillInactive,
            ]}>
              <Text style={[
                styles.blankPillText,
                step === 'participle' && !participleAnswered
                  ? styles.blankTextActive
                  : participleAnswered
                    ? participleCorrect ? styles.blankTextCorrect : styles.blankTextWrong
                    : styles.blankTextInactive,
              ]}>
                {participleAnswered ? card.participleOptions[card.correctParticiple] : '________'}
              </Text>
              {!participleAnswered && (
                <Text style={[styles.blankLabel, step !== 'participle' && { color: colors.textMuted }]}>
                  Partizip II
                </Text>
              )}
            </View>

            {(parts[2] ?? '').trim() !== '' && (
              <Text style={styles.sentenceWord}>{(parts[2] ?? '').trim()}</Text>
            )}
          </View>
        </View>

        {step === 'participle' && !participleAnswered && (
          <Text style={styles.stepHint}>Schritt 1: Partizip II</Text>
        )}
        {step === 'auxiliary' && !auxiliaryAnswered && (
          <Text style={styles.stepHint}>Schritt 2: Hilfsverb</Text>
        )}
      </View>

      {step === 'participle' && (
        <View style={styles.optionGroup}>
          <Text style={styles.groupLabel}>Partizip II</Text>
          <View style={styles.options}>
            {card.participleOptions.map((option, index) => {
              const optionIsCorrect = index === card.correctParticiple;
              const isSelected = index === selectedParticiple;

              let rowStyle: ViewStyle[] = [styles.option];
              let letterStyle: ViewStyle[] = [styles.letterCircle];
              let labelColor = colors.text;

              if (!participleAnswered) {
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
                  onPress={() => handleSelectParticiple(index)}
                  disabled={participleAnswered}
                >
                  <View style={letterStyle}>
                    <Text style={[
                      styles.letterText,
                      participleAnswered && (optionIsCorrect || (isSelected && !optionIsCorrect)) && { color: '#FFFFFF' },
                    ]}>
                      {LETTERS[index]}
                    </Text>
                  </View>
                  <Text style={[styles.optionLabel, { color: labelColor }]}>
                    {option}
                  </Text>
                  {participleAnswered && isSelected && !optionIsCorrect && (
                    <Text style={styles.yourPickLabel}>Your pick</Text>
                  )}
                  {participleAnswered && optionIsCorrect && (
                    <Text style={styles.correctLabelText}>Correct</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {step === 'auxiliary' && (
        <View style={styles.optionGroup}>
          <Text style={styles.groupLabel}>Hilfsverb</Text>
          <View style={styles.options}>
            {card.auxiliaryOptions.map((option, index) => {
              const optionIsCorrect = index === card.correctAuxiliary;
              const isSelected = index === selectedAuxiliary;

              let rowStyle: ViewStyle[] = [styles.option];
              let letterStyle: ViewStyle[] = [styles.letterCircle];
              let labelColor = colors.text;

              if (!auxiliaryAnswered) {
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
                  onPress={() => handleSelectAuxiliary(index)}
                  disabled={auxiliaryAnswered}
                >
                  <View style={letterStyle}>
                    <Text style={[
                      styles.letterText,
                      auxiliaryAnswered && (optionIsCorrect || (isSelected && !optionIsCorrect)) && { color: '#FFFFFF' },
                    ]}>
                      {LETTERS[index]}
                    </Text>
                  </View>
                  <Text style={[styles.optionLabel, { color: labelColor }]}>
                    {option}
                  </Text>
                  {auxiliaryAnswered && isSelected && !optionIsCorrect && (
                    <Text style={styles.yourPickLabel}>Your pick</Text>
                  )}
                  {auxiliaryAnswered && optionIsCorrect && (
                    <Text style={styles.correctLabelText}>Correct</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {fullyAnswered && (
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
  blankPillInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
  stepHint: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.primary,
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
  correctLabelText: {
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
