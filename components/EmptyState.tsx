import { StyleSheet, Text, View } from 'react-native';
import { fonts, spacing } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  const { colors: c } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: c.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
