import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/useTheme';
import { radius } from '@/lib/theme';

interface CardProps { children: React.ReactNode; style?: ViewStyle; }
export function Card({ children, style }: CardProps) {
  const { colors: c } = useTheme();
  return <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.surfaceBorder }, style]}>{children}</View>;
}
const styles = StyleSheet.create({ card: { borderRadius: radius.xxl, borderWidth: 1, padding: 16 } });
