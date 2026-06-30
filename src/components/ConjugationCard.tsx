import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../theme';
import type { ConjugationCard as ConjugationCardType } from '../data/types';

interface Props {
  card: ConjugationCardType;
  onAnswer: (correct: boolean) => void;
}

export default function ConjugationCard({ card, onAnswer }: Props) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [card.id]);

  function handleSubmit() {
    if (submitted || input.trim().length === 0) return;
    const correct = input.trim() === card.answer;
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(correct);
    Speech.stop();
    const fullSentence = card.sentence.replace('___', card.answer);
    setTimeout(() => {
      Speech.speak(fullSentence, { language: 'de', rate: 1.1 });
    }, 150);
  }

  function speakSentence() {
    Speech.stop();
    const fullSentence = card.sentence.replace('___', card.answer);
    Speech.speak(fullSentence, { language: 'de', rate: 0.9 });
  }

  const parts = card.sentence.split('___');
  const hintColor = card.hint === 'sein' ? colors.die : colors.accent4;

  return (
    <View style={styles.container}>
      <View style={styles.questionSection}>
        <View style={[styles.categoryChip, { backgroundColor: colors.primary + '1A' }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>KONJUGATION</Text>
        </View>

        <View style={[styles.hintChip, { backgroundColor: hintColor + '1A' }]}>
          <Text style={[styles.hintText, { color: hintColor }]}>{card.hint}</Text>
        </View>

        <View style={styles.sentenceCard}>
          <Text style={styles.sentence}>
            {parts[0]}
            <Text style={styles.blank}>
              {submitted ? card.answer : '______'}
            </Text>
            {parts[1]}
          </Text>
        </View>
      </View>

      <View style={styles.inputSection}>
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            submitted && isCorrect && { borderColor: colors.success, backgroundColor: colors.successLight },
            submitted && !isCorrect && { borderColor: colors.error, backgroundColor: colors.errorLight },
          ]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          placeholder="Tippe deine Antwort..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitted}
          returnKeyType="done"
        />

        {!submitted && (
          <Pressable
            style={[styles.submitButton, input.trim().length === 0 && { opacity: 0.4 }]}
            onPress={handleSubmit}
            disabled={input.trim().length === 0}
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
              <Text style={styles.correctLabel}>Richtige Antwort:</Text>
              <Text style={styles.correctValue}>{card.answer}</Text>
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
  inputSection: {
    gap: spacing.md,
  },
  textInput: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
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
  correctLabel: {
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
