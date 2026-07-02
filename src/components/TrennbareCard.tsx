import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../theme';
import type { TrennbareCard as TrennbareCardType } from '../data/types';

interface Props {
  card: TrennbareCardType;
  onAnswer: (correct: boolean) => void;
}

export default function TrennbareCard({ card, onAnswer }: Props) {
  const [stemInput, setStemInput] = useState('');
  const [prefixInput, setPrefixInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const stemRef = useRef<TextInput>(null);
  const prefixRef = useRef<TextInput>(null);

  const stemCorrect = stemInput.trim().toLowerCase() === card.stemAnswer.toLowerCase();
  const prefixCorrect = prefixInput.trim().toLowerCase() === card.prefixAnswer.toLowerCase();
  const isCorrect = stemCorrect && prefixCorrect;

  useEffect(() => {
    const timer = setTimeout(() => {
      stemRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [card.id]);

  function handleSubmit() {
    if (submitted || (stemInput.trim().length === 0 && prefixInput.trim().length === 0)) return;
    setSubmitted(true);
    onAnswer(stemCorrect && prefixCorrect);
    Speech.stop();
    const fullSentence = card.sentence
      .replace('___', card.stemAnswer)
      .replace('___', card.prefixAnswer);
    setTimeout(() => {
      Speech.speak(fullSentence, { language: 'de', rate: 1.1 });
    }, 150);
  }

  function speakSentence() {
    Speech.stop();
    const fullSentence = card.sentence
      .replace('___', card.stemAnswer)
      .replace('___', card.prefixAnswer);
    Speech.speak(fullSentence, { language: 'de', rate: 0.9 });
  }

  const parts = card.sentence.split('___');
  const canSubmit = stemInput.trim().length > 0 || prefixInput.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.questionSection}>
        <View style={[styles.categoryChip, { backgroundColor: colors.error + '1A' }]}>
          <Text style={[styles.categoryText, { color: colors.error }]}>TRENNBARE VERBEN</Text>
        </View>

        <View style={[styles.hintChip, { backgroundColor: colors.accent4 + '1A' }]}>
          <Text style={[styles.hintText, { color: colors.accent4 }]}>{card.hint}</Text>
        </View>

        <View style={styles.sentenceCard}>
          <View style={styles.sentenceRow}>
            {parts[0].trim() !== '' && (
              <Text style={styles.sentenceWord}>{parts[0].trim()}</Text>
            )}
            <View style={[
              styles.blankPill,
              submitted
                ? stemCorrect ? styles.blankPillCorrect : styles.blankPillWrong
                : styles.blankPillActive,
            ]}>
              <Text style={[
                styles.blankPillText,
                submitted
                  ? stemCorrect ? styles.blankTextCorrect : styles.blankTextWrong
                  : styles.blankTextActive,
              ]}>
                {submitted ? card.stemAnswer : '________'}
              </Text>
              {!submitted && (
                <Text style={styles.blankLabel}>Stamm</Text>
              )}
            </View>
            {parts[1].trim() !== '' && (
              <Text style={styles.sentenceWord}>{parts[1].trim()}</Text>
            )}
            <View style={[
              styles.blankPill,
              submitted
                ? prefixCorrect ? styles.blankPillCorrect : styles.blankPillWrong
                : styles.blankPillActive,
            ]}>
              <Text style={[
                styles.blankPillText,
                submitted
                  ? prefixCorrect ? styles.blankTextCorrect : styles.blankTextWrong
                  : styles.blankTextActive,
              ]}>
                {submitted ? card.prefixAnswer : '________'}
              </Text>
              {!submitted && (
                <Text style={styles.blankLabel}>Vorsilbe</Text>
              )}
            </View>
            {(parts[2] ?? '').trim() !== '' && (
              <Text style={styles.sentenceWord}>{(parts[2] ?? '').trim()}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Stamm</Text>
            <TextInput
              ref={stemRef}
              style={[
                styles.textInput,
                submitted && stemCorrect && { borderColor: colors.success, backgroundColor: colors.successLight },
                submitted && !stemCorrect && { borderColor: colors.error, backgroundColor: colors.errorLight },
              ]}
              value={stemInput}
              onChangeText={setStemInput}
              onSubmitEditing={() => prefixRef.current?.focus()}
              placeholder="z.B. stehe"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitted}
              returnKeyType="next"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Vorsilbe</Text>
            <TextInput
              ref={prefixRef}
              style={[
                styles.textInput,
                submitted && prefixCorrect && { borderColor: colors.success, backgroundColor: colors.successLight },
                submitted && !prefixCorrect && { borderColor: colors.error, backgroundColor: colors.errorLight },
              ]}
              value={prefixInput}
              onChangeText={setPrefixInput}
              onSubmitEditing={handleSubmit}
              placeholder="z.B. auf"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitted}
              returnKeyType="done"
            />
          </View>
        </View>

        {!submitted && (
          <Pressable
            style={[styles.submitButton, !canSubmit && { opacity: 0.4 }]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.submitText}>Check</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      {submitted && (
        <View style={styles.explanation}>
          {!isCorrect && (
            <View style={styles.correctAnswer}>
              <Text style={styles.correctAnswerLabel}>Richtige Antwort:</Text>
              <Text style={styles.correctValue}>
                {card.stemAnswer} ... {card.prefixAnswer}
              </Text>
            </View>
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
    marginBottom: spacing.sm,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 1.5,
  },
  hintChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  hintText: {
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_700Bold',
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
    minWidth: 80,
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
  inputSection: {
    gap: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.text,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitText: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
  },
  explanation: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  correctAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  correctAnswerLabel: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textSecondary,
  },
  correctValue: {
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.success,
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
