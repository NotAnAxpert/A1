import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { colors, spacing, fontSize, radius, shadow } from '../src/theme';
import { getProgress } from '../src/db/database';
import LeitnerProgress from '../src/components/LeitnerProgress';
import type { Progress } from '../src/data/types';

export default function ProgressScreen() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProgress().then(setProgress).catch(() => {});
    }, [])
  );

  if (!progress) return null;

  const totalLearned = progress.vocabLearned + progress.grammarLearned;
  const totalCards = progress.vocabTotal + progress.grammarTotal;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Progress' }} />

      <View style={styles.readinessCard}>
        <Text style={styles.readinessEmoji}>✧</Text>
        <Text style={styles.readinessValue}>{progress.readiness}%</Text>
        <Text style={styles.readinessLabel}>Exam Readiness</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalLearned}</Text>
          <Text style={styles.statLabel}>Learned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCards}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.accent4 }]}>{progress.streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wortschatz</Text>
        <View style={styles.sectionBar}>
          <View style={[styles.sectionFill, {
            width: progress.vocabTotal > 0 ? `${(progress.vocabLearned / progress.vocabTotal) * 100}%` : '0%',
            backgroundColor: colors.primary,
          }]} />
        </View>
        <Text style={styles.sectionStat}>
          {progress.vocabLearned} / {progress.vocabTotal} words in Box 3+
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grammatik</Text>
        <View style={styles.sectionBar}>
          <View style={[styles.sectionFill, {
            width: progress.grammarTotal > 0 ? `${(progress.grammarLearned / progress.grammarTotal) * 100}%` : '0%',
            backgroundColor: colors.accent2,
          }]} />
        </View>
        <Text style={styles.sectionStat}>
          {progress.grammarLearned} / {progress.grammarTotal} sentences in Box 3+
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leitner Boxes</Text>
        <LeitnerProgress distribution={progress.boxDistribution} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  readinessCard: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.xl,
    borderWidth: 2.5,
    borderColor: '#3A3A4A',
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow,
  },
  readinessEmoji: {
    fontSize: 32,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  readinessValue: {
    fontSize: 64,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.primary,
  },
  readinessLabel: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  sectionFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionStat: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.textSecondary,
  },
});
