import { StyleSheet, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/useTheme';
import { radius, spacing } from '@/lib/theme';

interface ButtonProps {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean; loading?: boolean; style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const { colors: c } = useTheme();
  const v: Record<string, { bg: string; text: string }> = {
    primary: { bg: c.blue600, text: c.white },
    secondary: { bg: c.blue50, text: c.blue600 },
    ghost: { bg: 'transparent', text: c.blue600 },
    danger: { bg: c.red50, text: c.red500 },
  };
  const vc = v[variant];
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.base, { backgroundColor: vc.bg }, disabled && styles.disabled, style]} activeOpacity={0.8}>
      <Text style={[styles.label, { color: vc.text }]}>{loading ? 'Please wait...' : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', minHeight: 52 } as ViewStyle,
  disabled: { opacity: 0.5 } as ViewStyle,
  label: { fontFamily: 'Manrope-Bold', fontSize: 16 },
});
