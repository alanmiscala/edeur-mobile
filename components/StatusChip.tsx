import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/useTheme';
import { spacing, radius } from '@/lib/theme';

interface StatusChipProps { label: string; variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate'; style?: ViewStyle; }

const vk = {
  blue: { bg: 'blue50', text: 'blue500' },
  emerald: { bg: 'emerald50', text: 'emerald500' },
  amber: { bg: 'amber100', text: 'amber500' },
  red: { bg: 'red50', text: 'red500' },
  slate: { bg: 'slate100', text: 'slate500' },
} as const;

export function StatusChip({ label, variant = 'blue', style }: StatusChipProps) {
  const { colors: c } = useTheme();
  const v = vk[variant];
  return <View style={[styles.chip, { backgroundColor: c[v.bg] }, style]}><Text style={[styles.text, { color: c[v.text] }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: radius.sm },
  text: { fontFamily: 'Manrope-Bold', fontSize: 11, lineHeight: 14 },
});
