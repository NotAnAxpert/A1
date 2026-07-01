import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, type ViewStyle } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../theme';
import type { VocabCard as VocabCardType, Article } from '../data/types';

const isWeb = Platform.OS === 'web';

interface Props {
  card: VocabCardType;
  onAnswer: (correct: boolean) => void;
}

const ARTICLES: { label: string; letter: string; key: Article; color: string }[] = [
  { label: 'der', letter: '1', key: 'der', color: colors.der },
  { label: 'die', letter: '2', key: 'die', color: colors.die },
  { label: 'das', letter: '3', key: 'das', color: colors.das },
  { label: 'die (Pl.)', letter: '4', key: 'plural', color: colors.plural },
];

export default function VocabCard({ card, onAnswer }: Props) {
  const [selected, setSelected] = useState<Article | null>(null);
  const answered = selected !== null;
  const correctKey: Article = card.article;

  useEffect(() => {
    Speech.stop();
    const timer = setTimeout(() => {
      Speech.speak(card.word, { language: 'de', rate: 0.9 });
    }, 300);
    return () => clearTimeout(timer);
  }, [card.word]);

  function speak() {
    Speech.stop();
    const text = answered ? `${card.article}, ${card.word}` : card.word;
    Speech.speak(text, { language: 'de', rate: 0.9 });
  }

  function handleSelect(key: Article) {
    if (answered) return;
    setSelected(key);
    onAnswer(key === correctKey);
    Speech.stop();
    setTimeout(() => {
      Speech.speak(`${card.article}, ${card.word}`, { language: 'de', rate: 1.2 });
    }, 150);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, Article> = { '1': 'der', '2': 'die', '3': 'das', '4': 'plural' };
      const key = map[e.key];
      if (key) {
        e.preventDefault();
        handleSelect(key);
      }
    }
    if (typeof window !== 'undefined' && !answered) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [answered, card]);

  const correctArticle = ARTICLES.find((a) => a.key === correctKey)!;

  return (
    <View style={styles.container}>
      <View style={styles.wordSection}>
        <View style={styles.topicChip}>
          <Text style={styles.topicText}>{card.topic}</Text>
        </View>

        <Text style={styles.word}>{card.word}</Text>
        <Text style={styles.english}>{card.english}</Text>

        <Pressable onPress={speak} hitSlop={12} style={styles.speakerButton}>
          <Ionicons name="volume-medium" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.options}>
        {ARTICLES.map((a) => {
          const isCorrect = a.key === correctKey;
          const isSelected = a.key === selected;

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
              key={a.key}
              style={rowStyle}
              onPress={() => handleSelect(a.key)}
              disabled={answered}
            >
              <View style={letterStyle}>
                <Text style={[
                  styles.letterText,
                  (answered && (isCorrect || (isSelected && !isCorrect))) && { color: '#FFFFFF' },
                ]}>
                  {a.letter}
                </Text>
              </View>
              <Text style={[styles.optionLabel, { color: labelColor }]}>
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {answered && (
        <View style={[styles.reveal, { borderLeftColor: correctArticle.color }]}>
          <View style={styles.revealTop}>
            <Text style={styles.revealArticle}>
              <Text style={{ color: correctArticle.color }}>{card.article}</Text>
              {'  '}
              <Text style={styles.revealWord}>{card.word}</Text>
            </Text>
            <Pressable onPress={speak} hitSlop={8}>
              <Ionicons name="volume-medium" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.revealPlural}>Pl. die {card.plural}</Text>
          {card.genderRule && (
            <Text style={styles.genderRule}>{card.genderRule}</Text>
          )}
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
    marginBottom: spacing.xl,
  },
  topicChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  topicText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
  speakerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
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
  reveal: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: spacing.lg,
  },
  revealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  revealArticle: {
    fontSize: fontSize.xl,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  revealWord: {
    color: colors.text,
  },
  revealPlural: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  genderRule: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
