import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Gauge, Lock } from 'lucide-react-native';
import { useTheme } from '@/lib/useTheme';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { formatDuration } from '@/lib/utils';
import { spacing, radius } from '@/lib/theme';

export default function DeurMeterScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: c } = useTheme();
  const deur = mockRepository.getDeurById(id);
  const equipment = deur ? mockRepository.getEquipment(deur.equipmentId) : null;
  const hasOdometer = equipment?.hasOdometer ?? false;
  const netMs = deur ? mockRepository.getNetOperatingHours(id) : 0;
  const calcClosing = mockRepository.getCalculatedClosingMeter(id);
  const netHours = netMs / 3600000;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={{ flexGrow: 1 }}>
      <PageHeader title="Meter Reading" onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.iconHeader}>
          <View style={[styles.iconCircle, { backgroundColor: c.blue50 }]}>
            <Gauge size={28} color={c.blue600} strokeWidth={2} />
          </View>
          <Text style={[styles.iconTitle, { color: c.textPrimary }]}>Hour Meter</Text>
          <Text style={[styles.iconSubtitle, { color: c.textMuted }]}>Meter values are read-only and managed by Rental Operations Admin.</Text>
        </View>

        <Card>
          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: c.textSecondary }]}>Net Operating Time</Text>
            <Text style={[styles.calcValue, { color: c.emerald500 }]}>{formatDuration(netMs)}</Text>
          </View>
          <View style={[styles.calcDivider, { backgroundColor: c.slate100 }]} />
          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: c.textSecondary }]}>Net Operating Hours</Text>
            <Text style={[styles.calcValue, { color: c.textPrimary }]}>{netHours.toFixed(2)} h</Text>
          </View>
        </Card>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>OPENING HOUR METER</Text>
        <Card>
          <View style={styles.readOnlyRow}>
            <View style={styles.readOnlyLeft}>
              <Lock size={16} color={c.textMuted} strokeWidth={2} />
              <Text style={[styles.readOnlyLabel, { color: c.textSecondary }]}>Opening Hour Meter</Text>
            </View>
            <Text style={[styles.readOnlyValue, { color: deur?.openingMeter != null ? c.blue600 : c.textMuted }]}>
              {deur?.openingMeter != null ? `${deur.openingMeter.toLocaleString()} h` : 'Not Available'}
            </Text>
          </View>
        </Card>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>CALCULATED CLOSING HOUR METER</Text>
        <Card>
          <View style={styles.readOnlyRow}>
            <View style={styles.readOnlyLeft}>
              <Lock size={16} color={c.textMuted} strokeWidth={2} />
              <Text style={[styles.readOnlyLabel, { color: c.textSecondary }]}>Calculated Closing</Text>
            </View>
            <Text style={[styles.readOnlyValue, { color: calcClosing != null ? c.blue600 : c.textMuted }]}>
              {calcClosing != null ? `${calcClosing.toLocaleString()} h` : 'Not Available'}
            </Text>
          </View>
          <View style={[styles.calcDivider, { backgroundColor: c.slate100 }]} />
          <Text style={[styles.calcExplanation, { color: c.textMuted }]}>Opening Hour Meter + Net Operating Time (hours)</Text>
        </Card>

        {hasOdometer && (
          <>
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ODOMETER (OPENING)</Text>
            <Card>
              <View style={styles.readOnlyRow}>
                <View style={styles.readOnlyLeft}>
                  <Lock size={16} color={c.textMuted} strokeWidth={2} />
                  <Text style={[styles.readOnlyLabel, { color: c.textSecondary }]}>Opening Odometer</Text>
                </View>
                <Text style={[styles.readOnlyValue, { color: deur?.openingOdometer != null ? c.blue600 : c.textMuted }]}>
                  {deur?.openingOdometer != null ? `${deur.openingOdometer.toLocaleString()} km` : 'Not Available'}
                </Text>
              </View>
              <View style={[styles.calcDivider, { backgroundColor: c.slate100 }]} />
              <Text style={[styles.calcExplanation, { color: c.textMuted }]}>Odometer readings are captured from travel trail checkpoints and refuel transactions.</Text>
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  iconHeader: { alignItems: 'center', gap: 8, paddingVertical: spacing.xl },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  iconTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 18 },
  iconSubtitle: { fontFamily: 'Manrope-Regular', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  sectionLabel: { fontFamily: 'Manrope-ExtraBold', fontSize: 13, letterSpacing: 0.5 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  calcLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 13 },
  calcValue: { fontFamily: 'Manrope-Bold', fontSize: 15 },
  calcDivider: { height: 1 },
  readOnlyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  readOnlyLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readOnlyLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 13 },
  readOnlyValue: { fontFamily: 'Manrope-ExtraBold', fontSize: 18 },
  calcExplanation: { fontFamily: 'Manrope-Regular', fontSize: 12, paddingTop: 8 },
});
