import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import { spacing, radius, fonts } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

interface FuelGaugeSliderProps {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
}

const STEPS = 10;

export function FuelGaugeSlider({ value, onChange, label }: FuelGaugeSliderProps) {
  const { colors: c } = useTheme();
  const barWidth = useRef(0);
  const [dragging, setDragging] = useState(false);

  const currentStep = value != null ? Math.round(value / 10) : -1;

  const stepFromX = useCallback((x: number): number => {
    if (barWidth.current <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, x / barWidth.current));
    return Math.round(ratio * STEPS);
  }, []);

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    setDragging(true);
    const step = stepFromX(e.nativeEvent.locationX);
    onChange(step * 10);
  }, [onChange, stepFromX]);

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    const step = stepFromX(e.nativeEvent.locationX);
    onChange(step * 10);
  }, [onChange, stepFromX]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
  }, []);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    barWidth.current = e.nativeEvent.layout.width;
  }, []);

  const percentage = value != null ? value : 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      <View
        style={styles.barContainer}
        onLayout={handleLayout}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {Array.from({ length: STEPS }).map((_, i) => {
          const isFilled = i <= currentStep;
          const isSelected = i === currentStep;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onChange(i * 10)}
              activeOpacity={0.6}
              style={[
                styles.segment,
                {
                  backgroundColor: isFilled ? c.blue600 : c.slate100,
                  borderColor: isSelected ? c.blue600 : 'transparent',
                  borderWidth: isSelected ? 2 : 0,
                  opacity: dragging ? 0.8 : 1,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.scaleRow}>
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <Text key={v} style={[styles.scaleText, { color: c.textMuted }]}>{v}</Text>
        ))}
      </View>
      <Text style={[styles.percentage, { color: value != null ? c.blue600 : c.textMuted }]}>
        {value != null ? `${percentage}%` : 'Not set'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
  barContainer: { flexDirection: 'row', gap: 3, height: 44, alignItems: 'center' },
  segment: { flex: 1, height: 32, borderRadius: 4 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  scaleText: { fontFamily: fonts.regular, fontSize: 10 },
  percentage: { fontFamily: fonts.bold, fontSize: 16, textAlign: 'center', marginTop: 4 },
});
