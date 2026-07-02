import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, type ViewStyle } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../theme';
import type { SentenceCard as SentenceCardType } from '../data/types';

interface Props {
  card: SentenceCardType;
  onAnswer: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SentenceCard({ card, onAnswer }: Props) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [typedText, setTypedText] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [card.id]);

  const shuffledOrder = useMemo(() => {
    let order = shuffle(card.chunks.map((_, i) => i));
    // re-shuffle if accidentally in correct order
    const isIdentical = order.every((v, i) => v === i);
    if (isIdentical && card.chunks.length > 2) {
      order = shuffle(order);
    }
    return order;
  }, [card.id]);

  const allPlaced = selectedIndices.length === card.chunks.length;
  const punctuation = card.punctuation ?? '.';

  const availableIndices = useMemo(
    () => shuffledOrder.filter(i => !selectedIndices.includes(i)),
    [shuffledOrder, selectedIndices],
  );

  const matchingIndex = useMemo(() => {
    if (!typedText || answered) return null;
    const query = typedText.toLowerCase();
    const matches = availableIndices.filter(i =>
      card.chunks[i].toLowerCase().startsWith(query),
    );
    return matches.length === 1 ? matches[0] : null;
  }, [typedText, availableIndices, card.chunks, answered]);

  const selectWord = useCallback((chunkIndex: number) => {
    setSelectedIndices(prev => [...prev, chunkIndex]);
    setTypedText('');
  }, []);

  const handleTyping = useCallback((text: string) => {
    if (answered) return;
    setTypedText(text);

    const query = text.toLowerCase();
    if (!query) return;

    const matches = availableIndices.filter(i =>
      card.chunks[i].toLowerCase().startsWith(query),
    );
    if (matches.length === 1) {
      selectWord(matches[0]);
    }
  }, [answered, availableIndices, card.chunks, selectWord]);

  function handleChipTap(chunkIndex: number) {
    if (answered) return;
    if (selectedIndices.includes(chunkIndex)) {
      setSelectedIndices(selectedIndices.filter(i => i !== chunkIndex));
    } else {
      selectWord(chunkIndex);
    }
  }

  function handleCheck() {
    if (!allPlaced || answered) return;
    const userSentence = selectedIndices.map(i => card.chunks[i]);
    const correct = userSentence.every((chunk, i) => chunk === card.chunks[i]);
    setIsCorrect(correct);
    setAnswered(true);
    onAnswer(correct);

    Speech.stop();
    const fullSentence = card.chunks.join(' ');
    const capitalised = fullSentence.charAt(0).toUpperCase() + fullSentence.slice(1) + punctuation;
    setTimeout(() => {
      Speech.speak(capitalised, { language: 'de', rate: 1.1 });
    }, 150);
  }

  function speakSentence() {
    Speech.stop();
    const fullSentence = card.chunks.join(' ');
    const capitalised = fullSentence.charAt(0).toUpperCase() + fullSentence.slice(1) + punctuation;
    Speech.speak(capitalised, { language: 'de', rate: 0.9 });
  }

  const builtSentence = selectedIndices.map((i, pos) => {
    let text = card.chunks[i];
    if (pos === 0) text = text.charAt(0).toUpperCase() + text.slice(1);
    return text;
  }).join(' ');

  const correctSentenceDisplay = card.chunks.map((chunk, i) => {
    if (i === 0) return chunk.charAt(0).toUpperCase() + chunk.slice(1);
    return chunk;
  }).join(' ') + punctuation;

  return (
    <View style={styles.container}>
      <View style={styles.questionSection}>
        <View style={[styles.categoryChip, { backgroundColor: colors.accent4 + '1A' }]}>
          <Text style={[styles.categoryText, { color: colors.accent4 }]}>SATZBILDUNG</Text>
        </View>

        <Text style={styles.translationHint}>{card.translation}</Text>
      </View>

      <View style={styles.builderArea}>
        {selectedIndices.length > 0 ? (
          <View style={styles.builtChips}>
            {selectedIndices.map((chunkIdx, pos) => {
              let text = card.chunks[chunkIdx];
              if (pos === 0) text = text.charAt(0).toUpperCase() + text.slice(1);

              let chipStyle: ViewStyle[] = [styles.builtChip];
              if (answered && isCorrect) {
                chipStyle = [styles.builtChip, { borderColor: colors.success, backgroundColor: colors.successLight }];
              } else if (answered && !isCorrect) {
                const correctAtPos = card.chunks[pos];
                const userAtPos = card.chunks[chunkIdx];
                if (correctAtPos === userAtPos || (pos === 0 && correctAtPos.toLowerCase() === userAtPos.toLowerCase())) {
                  chipStyle = [styles.builtChip, { borderColor: colors.success, backgroundColor: colors.successLight }];
                } else {
                  chipStyle = [styles.builtChip, { borderColor: colors.error, backgroundColor: colors.errorLight }];
                }
              }

              return (
                <Pressable
                  key={`built-${chunkIdx}`}
                  style={chipStyle}
                  onPress={() => handleChipTap(chunkIdx)}
                  disabled={answered}
                >
                  <Text style={[
                    styles.builtChipText,
                    answered && isCorrect && { color: colors.success },
                  ]}>
                    {text}
                  </Text>
                </Pressable>
              );
            })}
            {allPlaced && !answered && (
              <Text style={styles.punctuationText}>{punctuation}</Text>
            )}
            {answered && (
              <Text style={styles.punctuationText}>{punctuation}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.placeholderText}>Tippe die Wörter in der richtigen Reihenfolge</Text>
        )}
      </View>

      <View style={styles.chipPool}>
        {shuffledOrder.map((chunkIdx) => {
          const isPlaced = selectedIndices.includes(chunkIdx);
          const isMatch = matchingIndex === chunkIdx;
          return (
            <Pressable
              key={`pool-${chunkIdx}`}
              style={[
                styles.poolChip,
                isPlaced && styles.poolChipPlaced,
                isMatch && styles.poolChipMatched,
              ]}
              onPress={() => handleChipTap(chunkIdx)}
              disabled={answered || isPlaced}
            >
              <Text style={[
                styles.poolChipText,
                isPlaced && styles.poolChipTextPlaced,
                isMatch && styles.poolChipTextMatched,
              ]}>
                {card.chunks[chunkIdx]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!answered && !allPlaced && (
        <TextInput
          ref={inputRef}
          style={styles.typeInput}
          value={typedText}
          onChangeText={handleTyping}
          placeholder="oder tippe hier..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
      )}

      {allPlaced && !answered && (
        <Pressable style={styles.checkButton} onPress={handleCheck}>
          <Text style={styles.checkText}>Check</Text>
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        </Pressable>
      )}

      {answered && (
        <View style={styles.explanation}>
          {!isCorrect && (
            <View style={styles.correctAnswer}>
              <Text style={styles.correctLabel}>Richtig:</Text>
              <Text style={styles.correctValue}>{correctSentenceDisplay}</Text>
            </View>
          )}
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
  translationHint: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  builderArea: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.lg,
    minHeight: 80,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  builtChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  builtChip: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  builtChipText: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.primary,
  },
  punctuationText: {
    fontSize: fontSize.xl,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textMuted,
    marginLeft: -4,
  },
  placeholderText: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
  chipPool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  poolChip: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  poolChipPlaced: {
    opacity: 0.2,
    borderStyle: 'dashed',
  },
  poolChipMatched: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  poolChipText: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.text,
  },
  poolChipTextPlaced: {
    color: colors.textMuted,
  },
  poolChipTextMatched: {
    color: colors.primary,
  },
  typeInput: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  checkButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  checkText: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
  },
  explanation: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  correctAnswer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  correctLabel: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  correctValue: {
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.success,
    textAlign: 'center',
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
