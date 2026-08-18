import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, type ViewStyle } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MessageSquare, AlertTriangle } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';

export default function DeurRemarksScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const deur = mockRepository.getDeurById(id);

  const [remarks, setRemarks] = useState(deur?.remarks ?? '');
  const [breakdownRemarks, setBreakdownRemarks] = useState(deur?.breakdownRemarks ?? '');

  const handleSave = () => {
    mockRepository.updateRemarks(id, remarks.trim(), breakdownRemarks.trim());
    router.back();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
      <PageHeader title="Remarks" onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <MessageSquare size={28} color={colors.blue600} strokeWidth={2} />
          </View>
          <Text style={styles.iconTitle}>Shift Remarks</Text>
          <Text style={styles.iconSubtitle}>Add general remarks and breakdown notes for this shift</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <MessageSquare size={16} color={colors.slate400} strokeWidth={2} />
              <Text style={styles.label}>General Remarks</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Any general notes about the shift..."
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </Card>

        <Card style={[styles.card, { borderColor: colors.red50 }] as unknown as ViewStyle}>
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <AlertTriangle size={16} color={colors.red500} strokeWidth={2} />
              <Text style={[styles.label, { color: colors.red500 }]}>Breakdown / Issue Notes</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={breakdownRemarks}
                onChangeText={setBreakdownRemarks}
                placeholder="Describe any breakdowns or issues encountered..."
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
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
    backgroundColor: colors.slate50,
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
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.slate900,
  },
  iconSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate500,
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
    color: colors.slate900,
  },
  inputContainer: {
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 100,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.slate900,
    minHeight: 76,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
