import { useCallback, useState } from 'react';
import { Text, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../src/theme';
import { getDueCount, getProgress } from '../src/db/database';
import type { Progress } from '../src/data/types';
import vocabData from '../src/data/vocab.json';
import grammarData from '../src/data/grammar.json';
import perfektData from '../src/data/perfekt.json';
import pluralData from '../src/data/plural.json';
import conjugationData from '../src/data/conjugation.json';
import sentenceData from '../src/data/sentences.json';

const uebungenTotal = perfektData.length + pluralData.length + conjugationData.length + sentenceData.length;

export default function HomeScreen() {
  const [vocabDue, setVocabDue] = useState(0);
  const [grammarDue, setGrammarDue] = useState(0);
  const [uebungenDue, setUebungenDue] = useState(0);
  const [progress, setProgress] = useState<Progress | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [vDue, gDue, uDue, prog] = await Promise.all([
            getDueCount('vocab'),
            getDueCount('grammar'),
            getDueCount('uebungen'),
            getProgress(),
          ]);
          setVocabDue(vDue);
          setGrammarDue(gDue);
          setUebungenDue(uDue);
          setProgress(prog);
        } catch {}
      })();
    }, [])
  );

  const totalDue = vocabDue + grammarDue + uebungenDue;

  const vocabTotal = vocabData.length;
  const grammarTotal = grammarData.length;
  const vocabSeen = progress?.vocabSeen ?? 0;
  const grammarSeen = progress?.grammarSeen ?? 0;
  const uebungenSeen = progress?.uebungenSeen ?? 0;
  const totalSeen = vocabSeen + grammarSeen + uebungenSeen;
  const totalCards = vocabTotal + grammarTotal + uebungenTotal;
  const readiness = totalCards > 0 ? Math.round((totalSeen / totalCards) * 100) : 0;

  function handleStart() {
    const counts = [
      { due: vocabDue, route: '/review/vocab' as const },
      { due: grammarDue, route: '/review/grammar' as const },
      { due: uebungenDue, route: '/review/uebungen' as const },
    ];
    const best = counts.sort((a, b) => b.due - a.due)[0];
    router.push(best.route);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Prüfung A1</Text>
            <Text style={styles.readiness}>
              Exam readiness <Text style={styles.readinessValue}>{readiness}%</Text>
            </Text>
          </View>
          {progress && progress.streak > 0 && (
            <View style={styles.streakPill}>
              <Text style={styles.streakNumber}>{progress.streak}</Text>
              <Text style={styles.streakFire}>🔥</Text>
            </View>
          )}
        </View>

        {/* Due banner */}
        {totalDue > 0 ? (
          <View style={styles.banner}>
            <View style={styles.bannerCircle1} />
            <View style={styles.bannerCircle2} />
            <View style={styles.bannerTop}>
              <View>
                <Text style={styles.bannerCount}>{totalDue}</Text>
                <Text style={styles.bannerLabel}>cards due today</Text>
              </View>
              <Pressable style={styles.bannerStart} onPress={handleStart}>
                <Text style={styles.bannerStartText}>Start</Text>
                <Ionicons name="play" size={13} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.bannerBreakdown}>
              {vocabDue > 0 && (
                <View style={styles.bannerItem}>
                  <View style={[styles.bannerDot, { backgroundColor: colors.der }]} />
                  <Text style={styles.bannerItemText}>{vocabDue} Vocab</Text>
                </View>
              )}
              {grammarDue > 0 && (
                <View style={styles.bannerItem}>
                  <View style={[styles.bannerDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.bannerItemText}>{grammarDue} Grammar</Text>
                </View>
              )}
              {uebungenDue > 0 && (
                <View style={styles.bannerItem}>
                  <View style={[styles.bannerDot, { backgroundColor: colors.accent4 }]} />
                  <Text style={styles.bannerItemText}>{uebungenDue} Übungen</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.banner, { backgroundColor: colors.success }]}>
            <View style={styles.bannerCircle1} />
            <View style={styles.bannerCircle2} />
            <View style={styles.bannerTop}>
              <View>
                <Text style={styles.bannerCount}>✧</Text>
                <Text style={styles.bannerLabel}>All caught up!</Text>
              </View>
              <Pressable style={styles.bannerStart} onPress={() => router.push('/review/uebungen')}>
                <Text style={styles.bannerStartText}>Practice</Text>
                <Ionicons name="play" size={13} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Practice section */}
        <Text style={styles.sectionLabel}>PRACTICE</Text>

        {/* Wortschatz row */}
        <Pressable style={styles.row} onPress={() => router.push('/review/vocab')}>
          <View style={[styles.rowIcon, { backgroundColor: colors.der }]}>
            <Text style={styles.rowIconText}>D/D/D</Text>
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>Wortschatz</Text>
            <Text style={styles.rowSub}>Der / Die / Das Drill</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${vocabTotal > 0 ? (vocabSeen / vocabTotal) * 100 : 0}%`, backgroundColor: colors.der }]} />
            </View>
          </View>
          <View style={styles.rowRight}>
            {vocabDue > 0 && (
              <View style={[styles.rowDueBadge, { backgroundColor: 'rgba(0, 191, 255, 0.1)' }]}>
                <Text style={[styles.rowDueText, { color: colors.der }]}>{vocabDue}</Text>
              </View>
            )}
            <Text style={styles.rowLearned}>{vocabSeen} / {vocabTotal}</Text>
          </View>
        </Pressable>

        {/* Grammatik row */}
        <Pressable style={styles.row} onPress={() => router.push('/review/grammar')}>
          <View style={[styles.rowIcon, { backgroundColor: colors.success }]}>
            <Ionicons name="text" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>Grammatik</Text>
            <Text style={styles.rowSub}>A1 Grammar Drills</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${grammarTotal > 0 ? (grammarSeen / grammarTotal) * 100 : 0}%`, backgroundColor: colors.success }]} />
            </View>
          </View>
          <View style={styles.rowRight}>
            {grammarDue > 0 && (
              <View style={[styles.rowDueBadge, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.rowDueText, { color: colors.success }]}>{grammarDue}</Text>
              </View>
            )}
            <Text style={styles.rowLearned}>{grammarSeen} / {grammarTotal}</Text>
          </View>
        </Pressable>

        {/* Übungen row */}
        <Pressable
          style={[styles.row, uebungenDue > 0 && { borderColor: 'rgba(255, 184, 71, 0.3)', borderWidth: 1.5 }]}
          onPress={() => router.push('/review/uebungen')}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.accent4 }]}>
            <Ionicons name="grid" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>Übungen</Text>
            <Text style={styles.rowSub}>Perfekt, Plural, Konjugation, Sätze</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uebungenTotal > 0 ? (uebungenSeen / uebungenTotal) * 100 : 0}%`, backgroundColor: colors.accent4 }]} />
            </View>
          </View>
          <View style={styles.rowRight}>
            {uebungenDue > 0 && (
              <View style={[styles.rowDueBadge, { backgroundColor: 'rgba(255, 184, 71, 0.1)' }]}>
                <Text style={[styles.rowDueText, { color: '#E09A20' }]}>{uebungenDue}</Text>
              </View>
            )}
            <Text style={styles.rowLearned}>{uebungenSeen} / {uebungenTotal}</Text>
          </View>
        </Pressable>

        {/* Progress footer */}
        <Pressable style={styles.footerLink} onPress={() => router.push('/progress')}>
          <Ionicons name="stats-chart" size={16} color={colors.primary} />
          <Text style={styles.footerLinkText}>View Progress</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.text,
    letterSpacing: -0.5,
  },
  readiness: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.textMuted,
    marginTop: 6,
  },
  readinessValue: {
    color: colors.primary,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 184, 71, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: 4,
  },
  streakNumber: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#E09A20',
  },
  streakFire: {
    fontSize: 14,
  },

  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: 28,
    overflow: 'hidden',
  },
  bannerCircle1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bannerCircle2: {
    position: 'absolute',
    bottom: -40,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bannerCount: {
    fontSize: 48,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
    lineHeight: 52,
    letterSpacing: -2,
  },
  bannerLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  bannerStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  bannerStartText: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
  },
  bannerBreakdown: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bannerItemText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
  },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 10,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.text,
    lineHeight: 20,
  },
  rowSub: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.textMuted,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowDueBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  rowDueText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  rowLearned: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.textMuted,
  },

  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    marginTop: 14,
  },
  footerLinkText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: colors.primary,
  },
});
