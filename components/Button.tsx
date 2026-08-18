import { StyleSheet, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const variantColors: Record<NonNullable<ButtonProps['variant']>, { bg: string; text: string }> = {
  primary: { bg: colors.blue600, text: colors.white },
  secondary: { bg: colors.blue50, text: colors.blue600 },
  ghost: { bg: 'transparent', text: colors.blue600 },
  danger: { bg: colors.red50, text: colors.red500 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: ButtonProps) {
  const v = variantColors[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, { backgroundColor: v.bg }, disabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: v.text }]}>
        {loading ? 'Please wait...' : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  } as ViewStyle,
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
  } as TextStyle,
});
