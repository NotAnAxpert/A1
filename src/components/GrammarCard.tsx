import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, type ViewStyle } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius, articleColors } from '../theme';
import type { GrammarCard as GrammarCardType } from '../data/types';

const isWeb = Platform.OS === 'web';
const LETTERS = ['1', '2', '3', '4'];

interface Props {
  card: GrammarCardType;
  onAnswer: (correct: boolean) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'artikel-kasus': colors.der,
  'verb-konjugation': colors.accent2,
  'trennbare-verben': colors.error,
  'modalverben': colors.primary,
  'negation': colors.die,
  'possessivpronomen': colors.accent4,
  'personalpronomen': colors.der,
  'perfekt': colors.accent2,
  'praepositionen': '#00838F',
  'imperativ': colors.error,
  'komparativ': colors.primary,
};

const CATEGORY_LABELS: Record<string, string> = {
  'artikel-kasus': 'ARTIKEL / KASUS',
  'verb-konjugation': 'KONJUGATION',
  'trennbare-verben': 'TRENNBARE VERBEN',
  'modalverben': 'MODALVERBEN',
  'negation': 'NEGATION',
  'possessivpronomen': 'POSSESSIVPRONOMEN',
  'personalpronomen': 'PERSONALPRONOMEN',
  'perfekt': 'PERFEKT',
  'praepositionen': 'PRÄPOSITIONEN',
  'imperativ': 'IMPERATIV',
  'komparativ': 'KOMPARATIV',
};

export default function GrammarCard({ card, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    onAnswer(index === card.correct);
    Speech.stop();
    const fullSentence = card.sentence.replace('___', card.options[card.correct]);
    setTimeout(() => {
      Speech.speak(fullSentence, { language: 'de', rate: 1.1 });
    }, 150);
  }

  function speakSentence() {
    Speech.stop();
    const fullSentence = card.sentence.replace('___', card.options[card.correct]);
    Speech.speak(fullSentence, { language: 'de', rate: 0.9 });
  }

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

  const parts = card.sentence.split('___');
  const catColor = CATEGORY_COLORS[card.category] ?? colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.questionSection}>
        <View style={[styles.categoryChip, { backgroundColor: catColor + '1A' }]}>
          <Text style={[styles.categoryText, { color: catColor }]}>
            {CATEGORY_LABELS[card.category] ?? card.category.toUpperCase()}
          </Text>
        </View>

        <View style={styles.sentenceCard}>
          <Text style={styles.sentence}>
            {parts[0]}
            <Text style={styles.blank}>
              {answered ? card.options[card.correct] : '______'}
            </Text>
            {parts[1]}
          </Text>
        </View>
      </View>

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
          {card.gender && (
            <Text style={[styles.genderNoun, { color: articleColors[card.gender] ?? colors.textSecondary }]}>
              {card.options[card.correct]}
            </Text>
          )}
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
  sentence: {
    fontSize: fontSize.xl,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 38,
  },
  blank: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.primary,
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
  genderNoun: {
    fontSize: fontSize.xl,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
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
