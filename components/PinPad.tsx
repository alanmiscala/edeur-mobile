import { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, type ViewStyle } from 'react-native';
import { Delete } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  onSubmit?: () => void;
  submitLabel?: string;
  loading?: boolean;
  style?: ViewStyle;
}

export function PinPad({
  value,
  onChange,
  maxLength = 4,
  onSubmit,
  submitLabel = 'Enter',
  loading = false,
  style,
}: PinPadProps) {
  const handlePress = useCallback(
    (digit: string) => {
      if (value.length >= maxLength) return;
      const next = value + digit;
      onChange(next);
    },
    [value, maxLength, onChange],
  );

  const handleBackspace = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [value, onChange]);

  const renderDot = (index: number) => {
    const filled = index < value.length;
    return <View key={index} style={[styles.dot, filled && styles.dotFilled]} />;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Masked dots display */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: maxLength }).map((_, i) => renderDot(i))}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <TouchableOpacity
            key={d}
            style={styles.key}
            onPress={() => handlePress(d)}
            activeOpacity={0.6}
            disabled={loading}
          >
            <Text style={styles.keyText}>{d}</Text>
          </TouchableOpacity>
        ))}

        {/* Bottom row: backspace, 0, submit */}
        <TouchableOpacity
          style={styles.key}
          onPress={handleBackspace}
          activeOpacity={0.6}
          disabled={loading || value.length === 0}
        >
          <Delete size={28} color={colors.slate700} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.key}
          onPress={() => handlePress('0')}
          activeOpacity={0.6}
          disabled={loading}
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.key, styles.submitKey]}
          onPress={onSubmit}
          activeOpacity={0.6}
          disabled={loading || value.length === 0}
        >
          <Text style={[styles.keyText, { color: colors.white, fontSize: 16 }]}>
            {loading ? '...' : submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xxl,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    height: 20,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.slate300,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.blue600,
    borderColor: colors.blue600,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.slate900,
  },
  submitKey: {
    backgroundColor: colors.blue600,
    borderColor: colors.blue600,
  },
});
