import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface StatusChipProps {
  label: string;
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
  style?: ViewStyle;
}

const variantStyles = {
  blue: { bg: colors.blue50, text: colors.blue500 },
  emerald: { bg: colors.emerald50, text: colors.emerald500 },
  amber: { bg: colors.amber100, text: colors.amber500 },
  red: { bg: colors.red50, text: colors.red500 },
  slate: { bg: colors.slate100, text: colors.slate500 },
};

export function StatusChip({ label, variant = 'blue', style }: StatusChipProps) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.chip, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
  },
});
