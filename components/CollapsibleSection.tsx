import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '@/lib/useTheme';
import { spacing, radius } from '@/lib/theme';
import { Card } from './Card';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const { colors: c } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => setOpen(!open)} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          {icon}
          <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
        </View>
        {open ? <ChevronUp size={18} color={c.textMuted} strokeWidth={2} /> : <ChevronDown size={18} color={c.textMuted} strokeWidth={2} />}
      </TouchableOpacity>
      {open && <View style={styles.body}>{children}</View>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0, padding: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, minHeight: 52 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  title: { fontFamily: 'Manrope-SemiBold', fontSize: 15 },
  body: { paddingHorizontal: 16, paddingBottom: 16, gap: 6 },
});
