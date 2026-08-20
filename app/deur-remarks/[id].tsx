import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, AlertTriangle } from 'lucide-react-native';
import { fonts, radius, spacing } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { ThemedTextInput } from '@/components/ThemedTextInput';

export default function DeurRemarksScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const deur = mockRepository.getDeurById(id);

  const [remarks, setRemarks] = useState(deur?.remarks ?? '');
  const [breakdownRemarks, setBreakdownRemarks] = useState(deur?.breakdownRemarks ?? '');

  const handleSave = () => {
    mockRepository.updateRemarks(id, remarks.trim(), breakdownRemarks.trim());
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}>
      <PageHeader title="Remarks" onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.iconHeader}>
          <View style={[styles.iconCircle, { backgroundColor: c.blue50 }]}>
            <MessageSquare size={28} color={c.blue600} strokeWidth={2} />
          </View>
          <Text style={[styles.iconTitle, { color: c.textPrimary }]}>Shift Remarks</Text>
          <Text style={[styles.iconSubtitle, { color: c.textMuted }]}>Add general remarks and breakdown notes for this shift</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <MessageSquare size={16} color={c.textMuted} strokeWidth={2} />
              <Text style={[styles.label, { color: c.textPrimary }]}>General Remarks</Text>
            </View>
            <ThemedTextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Any general notes about the shift..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Card>

        <Card style={[styles.card, { borderColor: c.red50 }] as any}>
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <AlertTriangle size={16} color={c.red500} strokeWidth={2} />
              <Text style={[styles.label, { color: c.red500 }]}>Breakdown / Issue Notes</Text>
            </View>
            <ThemedTextInput
              value={breakdownRemarks}
              onChangeText={setBreakdownRemarks}
              placeholder="Describe any breakdowns or issues encountered..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Card>

        <Button label="Save Remarks" onPress={handleSave} style={styles.saveButton} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  iconHeader: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
  },
  iconSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    gap: spacing.md,
  },
  field: {
    gap: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 100,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    minHeight: 76,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
