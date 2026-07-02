import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Platform, type ViewStyle } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../theme';
import type { VocabCard as VocabCardType, Article } from '../data/types';
import allVocab from '../data/vocab.json';

const isWeb = Platform.OS === 'web';

type QuestionType = 'article' | 'translate' | 'plural';

interface Props {
  card: VocabCardType;
  onAnswer: (correct: boolean) => void;
  currentBox?: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

function getOptionStyles(isOptCorrect: boolean, isSelected: boolean, isAnswered: boolean) {
  let rowStyle: ViewStyle[];
  let letterStyle: ViewStyle[];
  let labelColor = colors.text;

  if (!isAnswered) {
    rowStyle = [styles.option];
    letterStyle = [styles.letterCircle];
  } else if (isOptCorrect) {
    rowStyle = [styles.option, { backgroundColor: colors.successLight, borderColor: colors.success }];
    letterStyle = [styles.letterCircle, { backgroundColor: colors.success, borderColor: colors.success }];
    labelColor = colors.success;
  } else if (isSelected && !isOptCorrect) {
    rowStyle = [styles.option, { backgroundColor: colors.errorLight, borderColor: colors.error }];
    letterStyle = [styles.letterCircle, { backgroundColor: colors.error, borderColor: colors.error }];
    labelColor = colors.error;
  } else {
    rowStyle = [styles.option, { opacity: 0.4 }];
    letterStyle = [styles.letterCircle];
  }

  return { rowStyle, letterStyle, labelColor };
}

const ARTICLES: { label: string; letter: string; key: Article; color: string }[] = [
  { label: 'der', letter: '1', key: 'der', color: colors.der },
  { label: 'die', letter: '2', key: 'die', color: colors.die },
  { label: 'das', letter: '3', key: 'das', color: colors.das },
  { label: 'die (Pl.)', letter: '4', key: 'plural', color: colors.plural },
];

export default function VocabCard({ card, onAnswer, currentBox = 1 }: Props) {
  const [questionType] = useState<QuestionType>(() => {
    const types: QuestionType[] = ['article', 'translate', 'plural'];
    return types[Math.floor(Math.random() * types.length)];
  });

  const [translateOptions] = useState<VocabCardType[]>(() => {
    const sameTopic = (allVocab as VocabCardType[]).filter(
      (v) => v.topic === card.topic && v.id !== card.id
    );
    let distractors = shuffle(sameTopic).slice(0, 3);
    if (distractors.length < 3) {
      const others = (allVocab as VocabCardType[]).filter(
        (v) => v.id !== card.id && !distractors.some((d) => d.id === v.id)
      );
      distractors = [...distractors, ...shuffle(others).slice(0, 3 - distractors.length)];
    }
    return shuffle([card, ...distractors]);
  });

  const [pluralOptions] = useState<string[]>(() => {
    const otherPlurals = [...new Set(
      (allVocab as VocabCardType[])
        .filter((v) => v.id !== card.id && v.plural !== card.plural)
        .map((v) => v.plural)
    )];
    return shuffle([card.plural, ...shuffle(otherPlurals).slice(0, 3)]);
  });

  const useTyping = currentBox >= 3 && questionType !== 'article';

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const answered = questionType === 'article'
    ? selectedArticle !== null
    : useTyping
      ? submitted
      : selectedIndex !== null;

  let isCorrect = false;
  if (answered) {
    if (questionType === 'article') {
      isCorrect = selectedArticle === card.article;
    } else if (useTyping) {
      const n = normalize(typedAnswer);
      if (questionType === 'translate') {
        isCorrect = n === normalize(card.word) || n === normalize(`${card.article} ${card.word}`);
      } else {
        isCorrect = n === normalize(card.plural) || n === normalize(`die ${card.plural}`);
      }
    } else if (questionType === 'translate') {
      isCorrect = selectedIndex !== null && translateOptions[selectedIndex].id === card.id;
    } else {
      isCorrect = selectedIndex !== null && pluralOptions[selectedIndex] === card.plural;
    }
  }

  useEffect(() => {
    Speech.stop();
    if (questionType !== 'translate') {
      const timer = setTimeout(() => {
        Speech.speak(card.word, { language: 'de', rate: 0.9 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [card.word, questionType]);

  useEffect(() => {
    if (useTyping) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [useTyping]);

  function speakReveal() {
    Speech.stop();
    Speech.speak(`${card.article}, ${card.word}`, { language: 'de', rate: 0.9 });
  }

  function handleSelectArticle(key: Article) {
    if (answered) return;
    setSelectedArticle(key);
    onAnswer(key === card.article);
    Speech.stop();
    setTimeout(() => Speech.speak(`${card.article}, ${card.word}`, { language: 'de', rate: 1.2 }), 150);
  }

  function handleSelectOption(index: number) {
    if (answered) return;
    setSelectedIndex(index);
    let correct: boolean;
    if (questionType === 'translate') {
      correct = translateOptions[index].id === card.id;
    } else {
      correct = pluralOptions[index] === card.plural;
    }
    onAnswer(correct);
    Speech.stop();
    setTimeout(() => {
      questionType === 'plural'
        ? Speech.speak(`die ${card.plural}`, { language: 'de', rate: 0.9 })
        : Speech.speak(`${card.article}, ${card.word}`, { language: 'de', rate: 0.9 });
    }, 150);
  }

  function handleSubmitTyping() {
    if (answered || !typedAnswer.trim()) return;
    setSubmitted(true);
    const n = normalize(typedAnswer);
    let correct: boolean;
    if (questionType === 'translate') {
      correct = n === normalize(card.word) || n === normalize(`${card.article} ${card.word}`);
    } else {
      correct = n === normalize(card.plural) || n === normalize(`die ${card.plural}`);
    }
    onAnswer(correct);
    Speech.stop();
    setTimeout(() => {
      questionType === 'plural'
        ? Speech.speak(`die ${card.plural}`, { language: 'de', rate: 0.9 })
        : Speech.speak(`${card.article}, ${card.word}`, { language: 'de', rate: 0.9 });
    }, 150);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (answered) return;
      if (questionType === 'article') {
        const map: Record<string, Article> = { '1': 'der', '2': 'die', '3': 'das', '4': 'plural' };
        const key = map[e.key];
        if (key) { e.preventDefault(); handleSelectArticle(key); }
      } else if (!useTyping) {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < 4) { e.preventDefault(); handleSelectOption(idx); }
      }
    }
    if (typeof window !== 'undefined' && !answered) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [answered, questionType, useTyping, card]);

  const correctArticleInfo = ARTICLES.find((a) => a.key === card.article)!;

  return (
    <View style={styles.container}>
      <View style={styles.wordSection}>
        <View style={styles.topicChip}>
          <Text style={styles.topicText}>{card.topic}</Text>
        </View>

        {questionType === 'article' && (
          <>
            <Text style={styles.word}>{card.word}</Text>
            <Text style={styles.english}>{card.english}</Text>
            <Pressable onPress={() => { Speech.stop(); Speech.speak(card.word, { language: 'de', rate: 0.9 }); }} hitSlop={12} style={styles.speakerButton}>
              <Ionicons name="volume-medium" size={20} color={colors.primary} />
            </Pressable>
          </>
        )}

        {questionType === 'translate' && (
          <>
            <Text style={styles.word}>{card.english}</Text>
            <Text style={styles.subtitle}>What's the German word?</Text>
          </>
        )}

        {questionType === 'plural' && (
          <>
            <Text style={styles.word}>
              <Text style={{ color: correctArticleInfo.color }}>{card.article}</Text>
              {' '}{card.word}
            </Text>
            <Text style={styles.subtitle}>What's the plural?</Text>
            <Pressable onPress={() => { Speech.stop(); Speech.speak(card.word, { language: 'de', rate: 0.9 }); }} hitSlop={12} style={styles.speakerButton}>
              <Ionicons name="volume-medium" size={20} color={colors.primary} />
            </Pressable>
          </>
        )}
      </View>

      {questionType === 'article' && (
        <View style={styles.options}>
          {ARTICLES.map((a) => {
            const { rowStyle, letterStyle, labelColor } = getOptionStyles(a.key === card.article, a.key === selectedArticle, answered);
            return (
              <Pressable key={a.key} style={rowStyle} onPress={() => handleSelectArticle(a.key)} disabled={answered}>
                <View style={letterStyle}>
                  <Text style={[styles.letterText, answered && (a.key === card.article || a.key === selectedArticle) && { color: '#FFFFFF' }]}>
                    {a.letter}
                  </Text>
                </View>
                <Text style={[styles.optionLabel, { color: labelColor }]}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {questionType === 'translate' && !useTyping && (
        <View style={styles.options}>
          {translateOptions.map((option, idx) => {
            const optCorrect = option.id === card.id;
            const { rowStyle, letterStyle, labelColor } = getOptionStyles(optCorrect, idx === selectedIndex, answered);
            return (
              <Pressable key={option.id} style={rowStyle} onPress={() => handleSelectOption(idx)} disabled={answered}>
                <View style={letterStyle}>
                  <Text style={[styles.letterText, answered && (optCorrect || idx === selectedIndex) && { color: '#FFFFFF' }]}>
                    {String(idx + 1)}
                  </Text>
                </View>
                <Text style={[styles.optionLabel, { color: labelColor }]}>{option.word}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {questionType === 'plural' && !useTyping && (
        <View style={styles.options}>
          {pluralOptions.map((plural, idx) => {
            const optCorrect = plural === card.plural;
            const { rowStyle, letterStyle, labelColor } = getOptionStyles(optCorrect, idx === selectedIndex, answered);
            return (
              <Pressable key={idx} style={rowStyle} onPress={() => handleSelectOption(idx)} disabled={answered}>
                <View style={letterStyle}>
                  <Text style={[styles.letterText, answered && (optCorrect || idx === selectedIndex) && { color: '#FFFFFF' }]}>
                    {String(idx + 1)}
                  </Text>
                </View>
                <Text style={[styles.optionLabel, { color: labelColor }]}>die {plural}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {useTyping && (
        <View style={styles.typingSection}>
          {questionType === 'plural' && <Text style={styles.diePrefix}>die</Text>}
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              submitted && { borderColor: isCorrect ? colors.success : colors.error },
            ]}
            value={typedAnswer}
            onChangeText={setTypedAnswer}
            editable={!submitted}
            placeholder={questionType === 'translate' ? 'Type the German word...' : 'Type the plural form...'}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSubmitTyping}
            returnKeyType="done"
          />
          {!submitted && typedAnswer.trim().length > 0 && (
            <Pressable style={styles.checkButton} onPress={handleSubmitTyping}>
              <Text style={styles.checkButtonText}>Check</Text>
            </Pressable>
          )}
          {submitted && !isCorrect && (
            <Text style={styles.correctAnswerHint}>
              {questionType === 'translate' ? card.word : `die ${card.plural}`}
            </Text>
          )}
        </View>
      )}

      {answered && (
        <View style={[styles.reveal, { borderLeftColor: correctArticleInfo.color }]}>
          <View style={styles.revealTop}>
            <Text style={styles.revealArticle}>
              <Text style={{ color: correctArticleInfo.color }}>{card.article}</Text>
              {'  '}
              <Text style={styles.revealWord}>{card.word}</Text>
            </Text>
            <Pressable onPress={speakReveal} hitSlop={8}>
              <Ionicons name="volume-medium" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.revealPlural}>Pl. die {card.plural}</Text>
          {questionType !== 'article' && (
            <Text style={styles.revealEnglish}>{card.english}</Text>
          )}
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
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
  typingSection: {
    gap: spacing.md,
  },
  diePrefix: {
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.textSecondary,
  },
  textInput: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.text,
  },
  checkButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
  },
  correctAnswerHint: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.error,
    textAlign: 'center',
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
  revealEnglish: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  genderRule: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
