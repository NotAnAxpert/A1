import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius, articleColors } from '../theme';
import type { PluralCard as PluralCardType } from '../data/types';

const LETTERS = ['1', '2', '3', '4'];

interface Props {
  card: PluralCardType;
  onAnswer: (correct: boolean) => void;
}

export default function PluralCard({ card, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    onAnswer(index === card.correct);
    Speech.stop();
    setTimeout(() => {
      Speech.speak(card.options[card.correct], { language: 'de', rate: 1.1 });
    }, 150);
  }

  function speakPlural() {
    Speech.stop();
    Speech.speak(card.options[card.correct], { language: 'de', rate: 0.9 });
  }

  useEffect(() => {
    Speech.stop();
    const timer = setTimeout(() => {
      Speech.speak(`${card.article}, ${card.word}`, { language: 'de', rate: 0.9 });
    }, 300);
    return () => clearTimeout(timer);
  }, [card.word]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < card.options.length) {
        e.preventDefault();
        handleSelect(idx);
      }
    }
    if (typeof window !== 'undefined' && !answered) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [answered, card]);

  const articleColor = articleColors[card.article] ?? colors.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.wordSection}>
        <View style={[styles.categoryChip, { backgroundColor: colors.accent3 + '33' }]}>
          <Text style={[styles.categoryText, { color: '#6B8E23' }]}>PLURAL</Text>
        </View>

        <Text style={styles.articleLabel}>
          <Text style={{ color: articleColor }}>{card.article}</Text>
        </Text>
        <Text style={styles.word}>{card.word}</Text>
        <Text style={styles.english}>{card.translation.split(' → ')[0]}</Text>
      </View>

      <Text style={styles.promptText}>Was ist der Plural?</Text>

      <View style={styles.options}>
        {card.options.map((option, index) => {
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
          <Text style={styles.ruleText}>{card.rule}</Text>
          <Pressable style={styles.listenButton} onPress={speakPlural} hitSlop={8}>
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
  wordSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 1.5,
  },
  articleLabel: {
    fontSize: fontSize.xl,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: spacing.xs,
  },
  word: {
    fontSize: fontSize.hero,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.text,
  },
  english: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  promptText: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSolid,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
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
