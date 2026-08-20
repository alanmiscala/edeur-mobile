import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/lib/useTheme';
import { spacing } from '@/lib/theme';

interface PageHeaderProps { title: string; onBack?: () => void; rightElement?: React.ReactNode; }

export function PageHeader({ title, onBack, rightElement }: PageHeaderProps) {
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { backgroundColor: c.surface, borderBottomColor: c.surfaceBorder, paddingTop: insets.top }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft size={20} color={c.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      ) : <View style={styles.backButton} />}
      <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>{title}</Text>
      {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : <View style={styles.backButton} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, height: 56, borderBottomWidth: 1 },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: 'Manrope-Bold', fontSize: 18 },
  rightElement: { width: 32, alignItems: 'flex-end' },
});
