import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Fuel } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { mockRepository } from '@/lib/mockRepository';
import type { FuelGaugeLevel } from '@/lib/types';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { formatTime } from '@/lib/utils';

const GAUGE_LEVELS: FuelGaugeLevel[] = ['Empty', '25%', '50%', '75%', 'Full'];

export default function DeurFuelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const deur = mockRepository.getDeurById(id);

  const [quantity, setQuantity] = useState('');
  const [gaugeLevel, setGaugeLevel] = useState<FuelGaugeLevel | null>(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    const qty = parseFloat(quantity);
    if (!quantity.trim() || isNaN(qty)) {
      setError('Please enter a valid numeric fuel quantity.');
      return;
    }
    if (qty <= 0) {
      setError('Fuel quantity must be greater than zero.');
      return;
    }
    mockRepository.addFuelEntry(id, qty, gaugeLevel ?? undefined, remarks.trim() || undefined);
    setQuantity('');
    setGaugeLevel(null);
    setRemarks('');
  };

  const updatedDeur = mockRepository.getDeurById(id);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
      <PageHeader title="Fuel Entry" onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <Fuel size={28} color={colors.blue600} strokeWidth={2} />
          </View>
          <Text style={styles.iconTitle}>Record Fuel</Text>
          <Text style={styles.iconSubtitle}>Add fuel entries for this shift (in liters)</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Fuel Added (L)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g. 50"
                placeholderTextColor={colors.slate400}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fuel Gauge Indicator (optional)</Text>
            <View style={styles.gaugeRow}>
              {GAUGE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setGaugeLevel(gaugeLevel === level ? null : level)}
                  style={[
                    styles.gaugeChip,
                    {
                      backgroundColor: gaugeLevel === level ? colors.blue600 : colors.slate50,
                      borderColor: gaugeLevel === level ? colors.blue600 : colors.slate200,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.gaugeChipText, { color: gaugeLevel === level ? colors.white : colors.slate500 }]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Remarks (optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Any notes about this fuel entry"
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </Card>

        <Button label="Add Fuel Entry" onPress={handleAdd} style={styles.addButton} />

        {updatedDeur && updatedDeur.fuelEntries.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>TODAY&apos;S FUEL ENTRIES</Text>
            <Card style={styles.card}>
              {updatedDeur.fuelEntries.map((f, i) => (
                <View key={f.id}>
                  <View style={styles.fuelRow}>
                    <View style={styles.fuelIcon}>
                      <Fuel size={16} color={colors.blue600} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fuelQty}>{f.quantity} L</Text>
                      <Text style={styles.fuelTime}>{formatTime(f.timestamp)}</Text>
                      {f.gaugeLevel && <Text style={styles.fuelGauge}>Gauge: {f.gaugeLevel}</Text>}
                      {f.remarks ? <Text style={styles.fuelRemarks}>{f.remarks}</Text> : null}
                    </View>
                  </View>
                  {i < updatedDeur.fuelEntries.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </Card>
          </>
        )}
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
    gap: 6,
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
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.slate900,
    minHeight: 24,
  },
  gaugeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gaugeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    minHeight: 40,
    justifyContent: 'center',
  },
  gaugeChipText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.red500,
  },
  addButton: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.slate500,
    letterSpacing: 0.5,
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
  },
  fuelIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuelQty: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.slate900,
  },
  fuelTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  fuelGauge: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.blue600,
    marginTop: 2,
  },
  fuelRemarks: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
    fontStyle: 'italic',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate100,
    marginLeft: 12,
  },
});
