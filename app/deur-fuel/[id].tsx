import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fuel, TriangleAlert as AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '@/lib/useTheme';
import { useAuth } from '@/lib/auth';
import { mockRepository } from '@/lib/mockRepository';
import type { OdometerExceptionReason } from '@/lib/types';
import { ODOMETER_EXCEPTION_REASONS } from '@/lib/types';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { FuelGaugeSlider } from '@/components/FuelGaugeSlider';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { formatTime } from '@/lib/utils';
import { spacing, radius, fonts } from '@/lib/theme';

export default function DeurFuelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const { operator } = useAuth();
  const deur = mockRepository.getDeurById(id);
  const equipment = deur ? mockRepository.getEquipment(deur.equipmentId) : null;
  const hasOdometer = equipment?.hasOdometer ?? false;
  const calculatedClosing = mockRepository.getCalculatedClosingMeter(id);
  const isEditable = deur?.status === 'Active';

  const [fuelAdded, setFuelAdded] = useState('');
  const [gaugeBefore, setGaugeBefore] = useState<number | null>(null);
  const [gaugeAfter, setGaugeAfter] = useState<number | null>(null);
  const [remarks, setRemarks] = useState('');
  const [slipNumber, setSlipNumber] = useState('');
  const [location, setLocation] = useState('');
  const [odometer, setOdometer] = useState('');
  const [error, setError] = useState('');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState<OdometerExceptionReason | null>(null);
  const [exceptionRemarks, setExceptionRemarks] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleAdd = () => {
    setError('');
    if (!fuelAdded.trim() || isNaN(parseFloat(fuelAdded))) { setError('Fuel Added (Liters) is required.'); return; }
    const liters = parseFloat(fuelAdded);
    if (liters <= 0) { setError('Fuel Added must be greater than zero.'); return; }

    if (hasOdometer && !exceptionReason) {
      const odoVal = odometer.trim() ? parseFloat(odometer) : null;
      if (!odometer.trim() || isNaN(odoVal as number) || odoVal! < 0) { setError('Odometer reading is required for mobile equipment.'); return; }
    }

    if (!operator) return;

    const odoVal = odometer.trim() ? parseFloat(odometer) : null;
    mockRepository.addFuelTransaction({
      deurId: id, operatorId: operator.id, operatorName: operator.name, fuelAdded: liters,
      gaugeBefore: gaugeBefore ?? undefined, gaugeAfter: gaugeAfter ?? undefined,
      remarks: remarks.trim() || undefined, fuelSlipNumber: slipNumber.trim() || undefined,
      location: location.trim() || undefined, hourMeter: calculatedClosing,
      odometer: hasOdometer && !exceptionReason ? odoVal : null,
      odometerExceptionReason: exceptionReason ?? undefined,
      odometerExceptionRemarks: exceptionRemarks.trim() || undefined,
    });

    setFuelAdded(''); setGaugeBefore(null); setGaugeAfter(null);
    setRemarks(''); setSlipNumber(''); setLocation('');
    setOdometer(''); setExceptionReason(null); setExceptionRemarks(''); setError('');
  };

  const handleSelectException = (reason: OdometerExceptionReason) => {
    setExceptionReason(reason); setShowExceptionModal(false); setError('');
  };

  const updatedDeur = mockRepository.getDeurById(id);
  const totalFuel = updatedDeur ? mockRepository.getTotalFuelIssued(id) : 0;
  const effEntries = updatedDeur ? mockRepository.getFuelEfficiencyEntries(id) : [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}>
      <PageHeader title="Fuel Log" onBack={() => router.back()} />
      <View style={styles.content}>
        {isEditable ? (<>
        <View style={styles.iconHeader}>
          <View style={[styles.iconCircle, { backgroundColor: c.blue50 }]}>
            <Fuel size={28} color={c.blue600} strokeWidth={2} />
          </View>
          <Text style={[styles.iconTitle, { color: c.textPrimary }]}>Fuel Transaction</Text>
          <Text style={[styles.iconSubtitle, { color: c.textMuted }]}>Record fuel issued/added to equipment</Text>
        </View>

        {updatedDeur && updatedDeur.fuelEntries.length > 0 && (
          <View style={[styles.totalBanner, { backgroundColor: c.blue50 }]}>
            <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Total Fuel Issued</Text>
            <Text style={[styles.totalValue, { color: c.blue600 }]}>{totalFuel.toLocaleString()} L</Text>
          </View>
        )}

        <Card>
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textPrimary }]}>Fuel Added (Liters) *</Text>
            <ThemedTextInput value={fuelAdded} onChangeText={setFuelAdded} placeholder="e.g. 50" keyboardType="numeric" />
          </View>
        </Card>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>GAUGE OBSERVATION (OPTIONAL)</Text>
        <Card>
          <FuelGaugeSlider label="Gauge BEFORE Refueling" value={gaugeBefore} onChange={setGaugeBefore} />
          <View style={[styles.divider, { backgroundColor: c.slate100 }]} />
          <FuelGaugeSlider label="Gauge AFTER Refueling" value={gaugeAfter} onChange={setGaugeAfter} />
          <Text style={[styles.helperText, { color: c.textMuted }]}>Gauge levels are approximate observations only. Fuel Added (Liters) is the primary audited quantity.</Text>
        </Card>

        {hasOdometer && (
          <>
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ODOMETER</Text>
            <Card>
              <View style={styles.field}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Odometer at Refueling (km) {exceptionReason ? '' : '*'}</Text>
                <ThemedTextInput
                  value={odometer}
                  onChangeText={setOdometer}
                  placeholder="e.g. 120350"
                  placeholderTextColor={c.textMuted}
                  keyboardType="numeric"
                  editable={!exceptionReason}
                />
                {exceptionReason ? (
                  <View style={styles.exceptionSelected}>
                    <View style={styles.exceptionSelectedLeft}>
                      <AlertTriangle size={12} color={c.amber500} strokeWidth={2} />
                      <Text style={[styles.exceptionSelectedText, { color: c.amber500 }]}>Exception: {exceptionReason}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setExceptionReason(null); setExceptionRemarks(''); }}>
                      <Text style={[styles.clearException, { color: c.blue600 }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.exceptionBtn, { borderColor: c.amber500 }]} onPress={() => setShowExceptionModal(true)} activeOpacity={0.7}>
                    <AlertTriangle size={12} color={c.amber500} strokeWidth={2} />
                    <Text style={[styles.exceptionBtnText, { color: c.amber500 }]}>ODOMETER UNAVAILABLE</Text>
                  </TouchableOpacity>
                )}
                {exceptionReason && (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: c.textSecondary }]}>Exception Remarks (optional)</Text>
                    <ThemedTextInput value={exceptionRemarks} onChangeText={setExceptionRemarks} placeholder="Describe the issue..." multiline numberOfLines={2} textAlignVertical="top" />
                  </View>
                )}
              </View>
            </Card>
          </>
        )}

        <TouchableOpacity style={[styles.drawerToggle, { backgroundColor: c.surface, borderColor: c.surfaceBorder }]} onPress={() => setShowDetails(!showDetails)} activeOpacity={0.7}>
          <Text style={[styles.drawerToggleText, { color: c.textSecondary }]}>Additional Details</Text>
          {showDetails ? <ChevronUp size={18} color={c.textMuted} strokeWidth={2} /> : <ChevronDown size={18} color={c.textMuted} strokeWidth={2} />}
        </TouchableOpacity>
        {showDetails && (
          <Card>
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Fuel Slip Number</Text>
              <ThemedTextInput value={slipNumber} onChangeText={setSlipNumber} placeholder="e.g. FS-2026-001" />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Location</Text>
              <ThemedTextInput value={location} onChangeText={setLocation} placeholder="e.g. PSC Yard Fuel Station" />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Remarks</Text>
              <ThemedTextInput value={remarks} onChangeText={setRemarks} placeholder="Any notes about this fuel transaction" multiline numberOfLines={3} textAlignVertical="top" />
            </View>
            {calculatedClosing != null && (
              <View style={styles.autoField}>
                <Text style={[styles.autoLabel, { color: c.textMuted }]}>Hour Meter at Refueling (auto)</Text>
                <Text style={[styles.autoValue, { color: c.textSecondary }]}>{calculatedClosing.toLocaleString()} h</Text>
              </View>
            )}
          </Card>
        )}

        {error ? <Text style={[styles.errorText, { color: c.red500 }]}>{error}</Text> : null}
        <Button label="Add Fuel Transaction" onPress={handleAdd} style={styles.addButton} />
        </>
        ) : (
          <View style={[styles.readOnlyBanner, { backgroundColor: c.slate50 }]}>
            <Text style={[styles.readOnlyText, { color: c.textMuted }]}>Fuel Log is read-only. DEUR is {deur?.status ?? 'not active'}.</Text>
          </View>
        )}

        {updatedDeur && updatedDeur.fuelEntries.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>FUEL TRANSACTION LOG</Text>
            <Card>
              {updatedDeur.fuelEntries.map((f, i) => {
                const eff = effEntries.find((e) => e.fuelEntry.id === f.id);
                return (
                  <View key={f.id}>
                    <View style={styles.fuelRow}>
                      <View style={[styles.fuelIcon, { backgroundColor: c.blue50 }]}>
                        <Fuel size={16} color={c.blue600} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.fuelAdded, { color: c.textPrimary }]}>{f.fuelAdded} L added</Text>
                        <Text style={[styles.fuelOperator, { color: c.textMuted }]}>{f.operatorName} • {formatTime(f.timestamp)}</Text>
                        {f.gaugeBefore != null && <Text style={[styles.fuelGauge, { color: c.textMuted }]}>Before: {f.gaugeBefore}%</Text>}
                        {f.gaugeAfter != null && <Text style={[styles.fuelGauge, { color: c.textMuted }]}>After: {f.gaugeAfter}%</Text>}
                        {f.fuelSlipNumber && <Text style={[styles.fuelGauge, { color: c.textMuted }]}>Slip: {f.fuelSlipNumber}</Text>}
                        {f.location && <Text style={[styles.fuelGauge, { color: c.textMuted }]}>Location: {f.location}</Text>}
                        {f.hourMeter != null && <Text style={[styles.fuelGauge, { color: c.textMuted }]}>HM: {f.hourMeter.toLocaleString()} h</Text>}
                        {f.odometer != null && <Text style={[styles.fuelGauge, { color: c.blue600 }]}>Odo: {f.odometer.toLocaleString()} km</Text>}
                        {f.odometer == null && f.odometerExceptionReason && (
                          <View style={styles.exceptionBadge}>
                            <AlertTriangle size={10} color={c.amber500} strokeWidth={2} />
                            <Text style={[styles.exceptionText, { color: c.amber500 }]}>Odo Unavailable: {f.odometerExceptionReason}</Text>
                          </View>
                        )}
                        {eff && eff.distance != null && <Text style={[styles.fuelGauge, { color: c.textSecondary }]}>Distance: {eff.distance.toLocaleString()} km</Text>}
                        {eff && eff.efficiency != null && <Text style={[styles.fuelEfficiency, { color: c.emerald500 }]}>Efficiency: {eff.efficiency.toFixed(2)} km/L</Text>}
                        {eff && !eff.efficiency && eff.warning && <Text style={[styles.fuelWarning, { color: c.amber500 }]}>Efficiency: Not Available — {eff.warning}</Text>}
                        {f.remarks ? <Text style={[styles.fuelRemarks, { color: c.textMuted }]}>{f.remarks}</Text> : null}
                      </View>
                    </View>
                    {i < updatedDeur.fuelEntries.length - 1 && <View style={[styles.divider, { backgroundColor: c.slate100 }]} />}
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </View>

      <Modal visible={showExceptionModal} transparent animationType="fade" onRequestClose={() => setShowExceptionModal(false)}>
        <View style={styles.exceptionModalOverlay}>
          <View style={[styles.exceptionModal, { backgroundColor: c.surface }]}>
            <Text style={[styles.exceptionModalTitle, { color: c.textPrimary }]}>Odometer Unavailable</Text>
            <Text style={[styles.exceptionModalSub, { color: c.textMuted }]}>Select a reason for the odometer exception:</Text>
            <ScrollView style={styles.exceptionList}>
              {ODOMETER_EXCEPTION_REASONS.map((r) => (
                <TouchableOpacity key={r} style={[styles.exceptionItem, { borderBottomColor: c.slate100 }]} onPress={() => handleSelectException(r)} activeOpacity={0.7}>
                  <Text style={[styles.exceptionItemText, { color: c.textPrimary }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button label="Cancel" onPress={() => setShowExceptionModal(false)} variant="ghost" />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  iconHeader: { alignItems: 'center', gap: 8, paddingVertical: spacing.xl },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  iconTitle: { fontFamily: fonts.extrabold, fontSize: 18 },
  iconSubtitle: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  totalBanner: { borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 14 },
  totalValue: { fontFamily: fonts.extrabold, fontSize: 18 },
  sectionLabel: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 0.5 },
  drawerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  drawerToggleText: { fontFamily: fonts.semibold, fontSize: 14 },
  field: { gap: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
  helperText: { fontFamily: fonts.regular, fontSize: 12 },
  divider: { height: 1, marginVertical: 8 },
  autoField: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  autoLabel: { fontFamily: fonts.regular, fontSize: 13 },
  autoValue: { fontFamily: fonts.bold, fontSize: 14 },
  errorText: { fontFamily: fonts.medium, fontSize: 13 },
  addButton: { marginTop: spacing.sm },
  readOnlyBanner: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  readOnlyText: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center' },
  fuelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12 },
  fuelIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  fuelAdded: { fontFamily: fonts.bold, fontSize: 15 },
  fuelOperator: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  fuelGauge: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },
  fuelEfficiency: { fontFamily: fonts.bold, fontSize: 13, marginTop: 2 },
  fuelWarning: { fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  fuelRemarks: { fontFamily: fonts.regular, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  exceptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  exceptionText: { fontFamily: fonts.medium, fontSize: 11 },
  exceptionSelected: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  exceptionSelectedLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exceptionSelectedText: { fontFamily: fonts.medium, fontSize: 12 },
  clearException: { fontFamily: fonts.bold, fontSize: 12 },
  exceptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 12, marginTop: 6 },
  exceptionBtnText: { fontFamily: fonts.bold, fontSize: 12 },
  exceptionModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  exceptionModal: { borderRadius: radius.lg, padding: 20, width: '100%', maxWidth: 360, gap: 12 },
  exceptionModalTitle: { fontFamily: fonts.extrabold, fontSize: 18, textAlign: 'center' },
  exceptionModalSub: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
  exceptionList: { maxHeight: 280 },
  exceptionItem: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, minHeight: 50, justifyContent: 'center' },
  exceptionItemText: { fontFamily: fonts.semibold, fontSize: 15 },
});
