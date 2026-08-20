import { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, type ViewStyle } from 'react-native';
import { Delete, Check } from 'lucide-react-native';
import { spacing, radius } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  onSubmit?: () => void;
  submitLabel?: string;
  loading?: boolean;
  style?: ViewStyle;
}

export function PinPad({ value, onChange, maxLength = 4, onSubmit, submitLabel = 'Enter', loading = false, style }: PinPadProps) {
  const { colors: c } = useTheme();

  const handlePress = useCallback((digit: string) => {
    if (value.length >= maxLength) return;
    onChange(value + digit);
  }, [value, maxLength, onChange]);

  const handleBackspace = useCallback(() => onChange(value.slice(0, -1)), [value, onChange]);

  const renderDot = (index: number) => {
    const filled = index < value.length;
    return <View key={index} style={[styles.dot, { borderColor: c.slate300, backgroundColor: filled ? c.blue600 : 'transparent' }]} />;
  };

  const rows: (string | 'back' | 'submit')[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['back', '0', 'submit'],
  ];

  const renderKey = (key: string | 'back' | 'submit') => {
    if (key === 'back') return (
      <TouchableOpacity key="back" style={[styles.key, { backgroundColor: c.surface, borderColor: c.surfaceBorder }]} onPress={handleBackspace} activeOpacity={0.5} disabled={loading || value.length === 0}>
        <Delete size={24} color={c.textPrimary} strokeWidth={2} />
      </TouchableOpacity>
    );
    if (key === 'submit') return (
      <TouchableOpacity key="submit" style={[styles.key, styles.submitKey, { backgroundColor: c.blue600 }]} onPress={onSubmit} activeOpacity={0.5} disabled={loading || value.length === 0}>
        <Check size={24} color={c.white} strokeWidth={2.5} />
      </TouchableOpacity>
    );
    return (
      <TouchableOpacity key={key} style={[styles.key, { backgroundColor: c.surface, borderColor: c.surfaceBorder }]} onPress={() => handlePress(key)} activeOpacity={0.5} disabled={loading}>
        <Text style={[styles.keyText, { color: c.textPrimary }]}>{key}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.dotsContainer}>{Array.from({ length: maxLength }).map((_, i) => renderDot(i))}</View>
      <View style={styles.keypad}>{rows.map((row, ri) => (
        <View key={ri} style={styles.keypadRow}>{row.map((k) => renderKey(k))}</View>
      ))}</View>
      {onSubmit && <Text style={[styles.submitLabel, { color: c.textMuted }]}>{loading ? 'Please wait...' : submitLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 20 },
  dotsContainer: { flexDirection: 'row', gap: 16, height: 20, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  keypad: { gap: 12 },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  key: { width: 72, height: 72, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: 'Manrope-Bold', fontSize: 28 },
  submitKey: { borderWidth: 0 },
  submitLabel: { fontFamily: 'Manrope-Medium', fontSize: 14, marginTop: 4 },
});
