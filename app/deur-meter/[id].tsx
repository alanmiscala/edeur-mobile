import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Gauge, MapPin, Lightbulb } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { formatDuration } from '@/lib/utils';

export default function DeurMeterScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const deur = mockRepository.getDeurById(id);
  const equipment = deur ? mockRepository.getEquipment(deur.equipmentId) : null;
  const hasOdometer = equipment?.hasOdometer ?? false;

  const [opening, setOpening] = useState(deur?.openingMeter?.toString() ?? '');
  const [closing, setClosing] = useState(deur?.closingMeter?.toString() ?? '');
  const [openingOdo, setOpeningOdo] = useState(deur?.openingOdometer?.toString() ?? '');
  const [closingOdo, setClosingOdo] = useState(deur?.closingOdometer?.toString() ?? '');
  const [error, setError] = useState('');

  const netOperatingMs = deur ? mockRepository.getNetOperatingHours(id) : 0;
  const suggestedClosing = mockRepository.getSuggestedClosingMeter(id);
  const netHoursRounded = Math.round((netOperatingMs / 3600000) * 10) / 10;

  const handleSave = () => {
    setError('');
    const openingVal = opening.trim() ? parseFloat(opening) : null;
    const closingVal = closing.trim() ? parseFloat(closing) : null;

    if (opening.trim() && (isNaN(openingVal as number) || openingVal! < 0)) {
      setError('Opening meter must be a valid non-negative number.');
      return;
    }
    if (closing.trim() && (isNaN(closingVal as number) || closingVal! < 0)) {
      setError('Closing meter must be a valid non-negative number.');
      return;
    }
    if (closingVal !== null && openingVal !== null && closingVal < openingVal) {
      setError('Closing meter should not be less than opening meter.');
      return;
    }

    if (hasOdometer) {
      const odoOpeningVal = openingOdo.trim() ? parseFloat(openingOdo) : null;
      const odoClosingVal = closingOdo.trim() ? parseFloat(closingOdo) : null;
      if (openingOdo.trim() && (isNaN(odoOpeningVal as number) || odoOpeningVal! < 0)) {
        setError('Opening odometer must be a valid non-negative number.');
        return;
      }
      if (closingOdo.trim() && (isNaN(odoClosingVal as number) || odoClosingVal! < 0)) {
        setError('Closing odometer must be a valid non-negative number.');
        return;
      }
      if (odoClosingVal !== null && odoOpeningVal !== null && odoClosingVal < odoOpeningVal) {
        setError('Closing odometer should not be less than opening odometer.');
        return;
      }
      mockRepository.updateOdometer(id, odoOpeningVal, odoClosingVal);
    }

    mockRepository.updateMeter(id, openingVal, closingVal);
    router.back();
  };

  const applySuggestedClosing = () => {
    if (suggestedClosing != null) {
      setClosing(suggestedClosing.toString());
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
      <PageHeader title="Meter Reading" onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <Gauge size={28} color={colors.blue600} strokeWidth={2} />
          </View>
          <Text style={styles.iconTitle}>Hour Meter Readings</Text>
          <Text style={styles.iconSubtitle}>Record the equipment&apos;s hour meter at start and end of shift</Text>
        </View>

        {/* Assisted calculation hint */}
        {netHoursRounded > 0 && (
          <Card style={styles.hintCard}>
            <View style={styles.hintRow}>
              <Lightbulb size={16} color={colors.amber500} strokeWidth={2} />
              <Text style={styles.hintText}>
                Net Operating Hours: {formatDuration(netOperatingMs)}
              </Text>
            </View>
            {suggestedClosing != null && (
              <TouchableOpacity style={styles.suggestButton} onPress={applySuggestedClosing} activeOpacity={0.7}>
                <Text style={styles.suggestText}>
                  Use suggested closing: {suggestedClosing.toLocaleString()} h
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        <Card style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Opening Hour Meter (h)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={opening}
                onChangeText={setOpening}
                placeholder="e.g. 4520"
                placeholderTextColor={colors.slate400}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Closing Hour Meter (h)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={closing}
                onChangeText={setClosing}
                placeholder="e.g. 4585"
                placeholderTextColor={colors.slate400}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        {hasOdometer && (
          <>
            <Text style={styles.sectionLabel}>ODOMETER</Text>
            <Card style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>Opening Odometer (km)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={openingOdo}
                    onChangeText={setOpeningOdo}
                    placeholder="e.g. 120300"
                    placeholderTextColor={colors.slate400}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Closing Odometer (km)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={closingOdo}
                    onChangeText={setClosingOdo}
                    placeholder="e.g. 120450"
                    placeholderTextColor={colors.slate400}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              {openingOdo.trim() && closingOdo.trim() && !isNaN(parseFloat(closingOdo)) && !isNaN(parseFloat(openingOdo)) && parseFloat(closingOdo) >= parseFloat(openingOdo) && (
                <View style={styles.distanceRow}>
                  <MapPin size={16} color={colors.blue600} strokeWidth={2} />
                  <Text style={styles.distanceText}>
                    Distance Travelled: {(parseFloat(closingOdo) - parseFloat(openingOdo)).toLocaleString()} km
                  </Text>
                </View>
              )}
            </Card>
          </>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button label="Save Meter Readings" onPress={handleSave} style={styles.saveButton} />
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
  hintCard: {
    gap: 10,
    backgroundColor: colors.amber50,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate700,
  },
  suggestButton: {
    backgroundColor: colors.amber100,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  suggestText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.amber500,
  },
  card: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.slate500,
    letterSpacing: 0.5,
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
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  distanceText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.blue600,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.red500,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
