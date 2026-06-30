import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, radius } from '../theme';

interface Props {
  distribution: number[];
}

const BOX_COLORS = [colors.error, colors.accent4, '#FFE066', colors.accent2, colors.success];
const BOX_LABELS = ['1', '2', '3', '4', '5'];

export default function LeitnerProgress({ distribution }: Props) {
  const total = distribution.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {distribution.map((count, i) => {
          const width = (count / total) * 100;
          if (width === 0) return null;
          return (
            <View
              key={i}
              style={[styles.segment, { width: `${width}%`, backgroundColor: BOX_COLORS[i] }]}
            />
          );
        })}
      </View>
      <View style={styles.labels}>
        {distribution.map((count, i) => (
          <View key={i} style={styles.label}>
            <View style={[styles.dot, { backgroundColor: BOX_COLORS[i] }]} />
            <Text style={styles.labelText}>
              Box {BOX_LABELS[i]}: {count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barContainer: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  segment: {
    height: '100%',
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  labelText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.textSecondary,
  },
});
