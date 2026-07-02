import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../theme';
import type { WelcherCard as WelcherCardType } from '../data/types';

const WELCHER_OPTIONS = ['welcher', 'welche', 'welches', 'welchem', 'welchen'];
const LETTERS = ['1', '2', '3', '4', '5'];

interface Props {
  card: WelcherCardType;
  onAnswer: (correct: boolean) => void;
}

export default function WelcherCard({ card, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    onAnswer(index === card.correct);
    Speech.stop();
    const fullSentence = card.sentence.replace('_____', WELCHER_OPTIONS[card.correct]);
    setTimeout(() => {
      Speech.speak(fullSentence, { language: 'de', rate: 1.1 });
    }, 150);
  }

  function speakSentence() {
    Speech.stop();
    const fullSentence = card.sentence.replace('_____', WELCHER_OPTIONS[card.correct]);
    Speech.speak(fullSentence, { language: 'de', rate: 0.9 });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < WELCHER_OPTIONS.length) {
        e.preventDefault();
        handleSelect(idx);
      }
    }
    if (typeof window !== 'undefined' && !answered) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [answered, card]);

  const parts = card.sentence.split('_____');

  return (
    <View style={styles.container}>
      <View style={styles.questionSection}>
        <View style={styles.chipRow}>
          <View style={[styles.categoryChip, { backgroundColor: 'rgba(0, 191, 255, 0.12)' }]}>
            <Text style={[styles.categoryText, { color: '#0088BB' }]}>WELCHER?</Text>
          </View>
          <View style={[styles.caseChip]}>
            <Text style={styles.caseText}>{card.case}</Text>
          </View>
        </View>

        <View style={styles.sentenceCard}>
          <Text style={styles.sentence}>
            {parts[0]}
            <Text style={styles.blank}>{'  ______  '}</Text>
            {parts[1]}
          </Text>
        </View>

        <Text style={styles.genderHint}>{card.genderHint}</Text>
      </View>

      <View style={styles.options}>
        {WELCHER_OPTIONS.map((option, index) => {
          const isCorrect = index === card.correct;
          const isSelected = index === selected;

          let rowStyle: ViewStyle[];
          let letterStyle: ViewStyle[];
          let labelColor = colors.text;

          if (!answered) {
            rowStyle = [styles.option];
            letterStyle = [styles.letterCircle];
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
            letterStyle = [styles.letterCircle];
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
                  (answered && (isCorrect || (isSelected && !isCorrect))) && { color: '#FFFFFF' },
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
    marginBottom: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 1.5,
  },
  caseChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
  },
  caseText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 1.5,
    color: colors.primary,
  },
  sentenceCard: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    width: '100%',
  },
  sentence: {
    fontSize: fontSize.xl,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 38,
  },
  blank: {
    color: colors.primary,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  genderHint: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.textSecondary,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  letterText: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textSecondary,
  },
  optionLabel: {
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  explanation: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  translationText: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
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
