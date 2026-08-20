import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation, Crosshair, Plus, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/lib/useTheme';
import { useAuth } from '@/lib/auth';
import { mockRepository } from '@/lib/mockRepository';
import type { GPSCoordinates, LocationSource, OdometerExceptionReason } from '@/lib/types';
import { ODOMETER_EXCEPTION_REASONS } from '@/lib/types';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import { formatTime, formatDurationShort } from '@/lib/utils';
import { spacing, radius, fonts } from '@/lib/theme';

export default function DeurTravelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const { operator } = useAuth();
  const deur = mockRepository.getDeurById(id);
  const equipment = deur ? mockRepository.getEquipment(deur.equipmentId) : null;
  const hasOdometer = equipment?.hasOdometer ?? false;
  const isEditable = deur?.status === 'Active';

  const [locationName, setLocationName] = useState('');
  const [odometer, setOdometer] = useState('');
  const [gps, setGps] = useState<GPSCoordinates | undefined>(undefined);
  const [locationSource, setLocationSource] = useState<LocationSource>('Manual');
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState<OdometerExceptionReason | null>(null);
  const [exceptionRemarks, setExceptionRemarks] = useState('');

  const checkpoints = deur?.travelCheckpoints ?? [];
  const hasInitial = checkpoints.some((cp) => cp.type === 'Initial');
  const legs = deur ? mockRepository.getTravelLegs(id) : [];
  const totalDistance = deur ? mockRepository.getTravelDistance(id) : null;
  const hasGaps = deur ? mockRepository.hasOdometerGaps(id) : false;

  const captureGps = () => {
    setCapturing(true);
    setError('');
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationSource('Manual');
      setCapturing(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationSource('GPS');
        setCapturing(false);
      },
      () => {
        setLocationSource('Manual');
        setCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const resetForm = () => {
    setLocationName('');
    setOdometer('');
    setGps(undefined);
    setLocationSource('Manual');
    setError('');
    setShowAddForm(false);
    setExceptionReason(null);
    setExceptionRemarks('');
  };

  const handleAddCheckpoint = () => {
    setError('');
    if (!locationName.trim()) {
      setError('Please enter a location name.');
      return;
    }
    if (hasOdometer && !exceptionReason) {
      const odoVal = odometer.trim() ? parseFloat(odometer) : null;
      if (!odometer.trim() || isNaN(odoVal as number) || odoVal! < 0) {
        setError('Odometer reading is required.');
        return;
      }
    }
    if (!operator || !deur) return;

    const odoVal = odometer.trim() ? parseFloat(odometer) : null;
    const type = hasInitial ? 'Arrival' : 'Initial';
    mockRepository.addTravelCheckpoint({
      deurId: id,
      type,
      locationName: locationName.trim(),
      gps,
      locationSource,
      odometer: hasOdometer && !exceptionReason ? odoVal : null,
      odometerExceptionReason: exceptionReason ?? undefined,
      odometerExceptionRemarks: exceptionRemarks.trim() || undefined,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorIsReliever: operator.isReliever ?? false,
    });

    resetForm();
  };

  const handleSelectException = (reason: OdometerExceptionReason) => {
    setExceptionReason(reason);
    setShowExceptionModal(false);
    setError('');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}>
      <PageHeader title="Travel Trail" onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.iconHeader}>
          <View style={[styles.iconCircle, { backgroundColor: c.blue50 }]}>
            <Navigation size={28} color={c.blue600} strokeWidth={2} />
          </View>
          <Text style={[styles.iconTitle, { color: c.textPrimary }]}>Travel Trail</Text>
          <Text style={[styles.iconSubtitle, { color: c.textMuted }]}>Record location checkpoints during your shift</Text>
        </View>

        {totalDistance != null && (
          <View style={[styles.totalBanner, { backgroundColor: c.blue50 }]}>
            <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Total Distance</Text>
            <Text style={[styles.totalValue, { color: c.blue600 }]}>{totalDistance.toLocaleString()} km</Text>
          </View>
        )}
        {hasGaps && (
          <View style={[styles.gapBanner, { backgroundColor: c.amber50 }]}>
            <AlertTriangle size={14} color={c.amber500} strokeWidth={2} />
            <Text style={[styles.gapText, { color: c.amber500 }]}>ODOMETER DATA INCOMPLETE — Some legs have unavailable distance</Text>
          </View>
        )}

        {checkpoints.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>CHECKPOINT TRAIL</Text>
            <Card>
              {checkpoints.map((cp, idx) => (
                <View key={cp.id}>
                  <View style={styles.checkpointItem}>
                    <View style={[styles.checkpointDot, { backgroundColor: cp.operatorIsReliever ? c.amber500 : c.blue600 }]} />
                    {idx < checkpoints.length - 1 && <View style={[styles.checkpointLine, { backgroundColor: c.slate200 }]} />}
                    <View style={styles.checkpointContent}>
                      <Text style={[styles.checkpointType, { color: c.textMuted }]}>{cp.type === 'Initial' ? 'INITIAL' : `CHECKPOINT ${cp.seq}`}</Text>
                      <Text style={[styles.checkpointName, { color: c.textPrimary }]}>{cp.locationName}</Text>
                      <Text style={[styles.checkpointMeta, { color: c.textMuted }]}>{formatTime(cp.timestamp)} • {cp.operatorDisplayName}{cp.operatorIsReliever ? ' (Reliever)' : ''}</Text>
                      {cp.odometer != null && <Text style={[styles.checkpointOdo, { color: c.blue600 }]}>Odometer: {cp.odometer.toLocaleString()} km</Text>}
                      {cp.odometer == null && cp.odometerExceptionReason && (
                        <View style={styles.exceptionBadge}>
                          <AlertTriangle size={11} color={c.amber500} strokeWidth={2} />
                          <Text style={[styles.exceptionText, { color: c.amber500 }]}>Odometer Unavailable: {cp.odometerExceptionReason}</Text>
                        </View>
                      )}
                      {cp.odometerExceptionRemarks && <Text style={[styles.checkpointRemarks, { color: c.textMuted }]}>Remarks: {cp.odometerExceptionRemarks}</Text>}
                      {cp.gps && <Text style={[styles.checkpointGps, { color: c.emerald500 }]}>GPS: {cp.gps.lat.toFixed(5)}, {cp.gps.lng.toFixed(5)}</Text>}
                      <Text style={[styles.checkpointSource, { color: c.textMuted }]}>{cp.locationSource}</Text>
                    </View>
                  </View>
                  {idx < checkpoints.length - 1 && legs[idx] && (
                    <View style={[styles.legInfo, { backgroundColor: c.slate50 }]}>
                      {legs[idx].distance != null ? (
                        <Text style={[styles.legText, { color: c.textSecondary }]}>{legs[idx].distance!.toLocaleString()} km</Text>
                      ) : (
                        <Text style={[styles.legTextUnavailable, { color: c.amber500 }]}>Distance: Unavailable</Text>
                      )}
                      <Text style={[styles.legText, { color: c.textMuted }]}>{formatDurationShort(legs[idx].durationMs)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </Card>
          </>
        )}

        {!showAddForm ? (
          isEditable ? (
            <Button
              label={hasInitial ? 'ADD ARRIVAL CHECKPOINT' : 'ADD INITIAL LOCATION'}
              onPress={() => setShowAddForm(true)}
              style={styles.addButton}
            />
          ) : (
            <View style={[styles.readOnlyBanner, { backgroundColor: c.slate50 }]}>
              <Text style={[styles.readOnlyText, { color: c.textMuted }]}>Travel Trail is read-only. DEUR is {deur?.status ?? 'not active'}.</Text>
            </View>
          )
        ) : (
          <Card>
            <Text style={[styles.formTitle, { color: c.textPrimary }]}>
              {hasInitial ? 'Record Arrival' : 'Record Initial Location'}
            </Text>
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Location Name *</Text>
              <ThemedTextInput
                value={locationName}
                onChangeText={setLocationName}
                placeholder="e.g. PSC Equipment Yard"
              />
            </View>

            {hasOdometer && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Odometer (km) {exceptionReason ? '' : '*'}</Text>
                <ThemedTextInput
                  value={odometer}
                  onChangeText={setOdometer}
                  placeholder="e.g. 120450"
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
                    <ThemedTextInput
                      value={exceptionRemarks}
                      onChangeText={setExceptionRemarks}
                      placeholder="Describe the issue..."
                    />
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.gpsButton, { backgroundColor: c.blue50 }]}
              onPress={captureGps}
              disabled={capturing}
              activeOpacity={0.7}
            >
              <Crosshair size={14} color={c.blue600} strokeWidth={2} />
              <Text style={[styles.gpsButtonText, { color: c.blue600 }]}>
                {capturing ? 'Capturing GPS...' : gps ? 'GPS Captured' : 'Capture GPS (optional)'}
              </Text>
            </TouchableOpacity>

            {gps && (
              <Text style={[styles.gpsText, { color: c.emerald500 }]}>
                GPS: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
              </Text>
            )}

            <View style={styles.sourceRow}>
              <Text style={[styles.sourceLabel, { color: c.textSecondary }]}>Source:</Text>
              <View style={[styles.sourceChip, { backgroundColor: locationSource === 'GPS' ? c.emerald50 : c.slate100 }]}>
                <Text style={[styles.sourceChipText, { color: locationSource === 'GPS' ? c.emerald500 : c.textMuted }]}>
                  {locationSource}
                </Text>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.formActions}>
              <Button label="Cancel" onPress={() => { resetForm(); }} variant="ghost" style={{ flex: 1 }} />
              <Button label="Submit Checkpoint" onPress={handleAddCheckpoint} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      </View>

      <Modal visible={showExceptionModal} transparent animationType="fade" onRequestClose={() => setShowExceptionModal(false)}>
        <View style={styles.exceptionModalOverlay}>
          <View style={[styles.exceptionModal, { backgroundColor: c.surface }]}>
            <Text style={[styles.exceptionModalTitle, { color: c.textPrimary }]}>Odometer Unavailable</Text>
            <Text style={[styles.exceptionModalSub, { color: c.textMuted }]}>Select a reason for the odometer exception:</Text>
            <ScrollView style={styles.exceptionList}>
              {ODOMETER_EXCEPTION_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.exceptionItem, { borderBottomColor: c.slate100 }]}
                  onPress={() => handleSelectException(r)}
                  activeOpacity={0.7}
                >
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
  gapBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12 },
  gapText: { fontFamily: fonts.medium, fontSize: 12 },
  sectionLabel: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 0.5 },
  checkpointItem: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  checkpointDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  checkpointLine: { position: 'absolute', left: 4, top: 14, width: 2, bottom: -12 },
  checkpointContent: { flex: 1, paddingBottom: 12 },
  checkpointType: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.5 },
  checkpointName: { fontFamily: fonts.bold, fontSize: 14, marginTop: 2 },
  checkpointMeta: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  checkpointOdo: { fontFamily: fonts.semibold, fontSize: 12, marginTop: 1 },
  exceptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  exceptionText: { fontFamily: fonts.medium, fontSize: 11 },
  checkpointRemarks: { fontFamily: fonts.regular, fontSize: 11, marginTop: 1, fontStyle: 'italic' },
  checkpointGps: { fontFamily: fonts.medium, fontSize: 12, marginTop: 1 },
  checkpointSource: { fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
  legInfo: { flexDirection: 'row', gap: 12, paddingVertical: 6, paddingHorizontal: 28, borderRadius: radius.sm },
  legText: { fontFamily: fonts.medium, fontSize: 12 },
  legTextUnavailable: { fontFamily: fonts.medium, fontSize: 12 },
  formTitle: { fontFamily: fonts.extrabold, fontSize: 16, marginBottom: 8 },
  field: { gap: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
  inputContainer: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 12 },
  input: { fontFamily: fonts.regular, fontSize: 16, minHeight: 24 },
  exceptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 12, marginTop: 6 },
  exceptionBtnText: { fontFamily: fonts.bold, fontSize: 12 },
  exceptionSelected: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  exceptionSelectedLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exceptionSelectedText: { fontFamily: fonts.medium, fontSize: 12 },
  clearException: { fontFamily: fonts.bold, fontSize: 12 },
  gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 12, marginTop: 8 },
  gpsButtonText: { fontFamily: fonts.bold, fontSize: 13 },
  gpsText: { fontFamily: fonts.medium, fontSize: 12, marginTop: 4 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  sourceLabel: { fontFamily: fonts.semibold, fontSize: 13 },
  sourceChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  sourceChipText: { fontFamily: fonts.bold, fontSize: 12 },
  errorText: { fontFamily: fonts.medium, fontSize: 13, marginTop: 8 },
  addButton: { marginTop: spacing.sm },
  readOnlyBanner: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  readOnlyText: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center' },
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: 12 },
  exceptionModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  exceptionModal: { borderRadius: radius.lg, padding: 20, width: '100%', maxWidth: 360, gap: 12 },
  exceptionModalTitle: { fontFamily: fonts.extrabold, fontSize: 18, textAlign: 'center' },
  exceptionModalSub: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
  exceptionList: { maxHeight: 280 },
  exceptionItem: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, minHeight: 50, justifyContent: 'center' },
  exceptionItemText: { fontFamily: fonts.semibold, fontSize: 15 },
});
