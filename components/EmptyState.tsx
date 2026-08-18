import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
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
    color: colors.slate900,
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
