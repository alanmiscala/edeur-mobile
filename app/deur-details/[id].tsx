import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp, Clock, Gauge, Fuel, MessageSquare, Navigation, Users, TriangleAlert as AlertTriangle, Activity, Truck, FileText, ClipboardList } from 'lucide-react-native';
import { useTheme } from '@/lib/useTheme';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { StatusChip } from '@/components/StatusChip';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import {
  formatDuration, formatDurationShort, formatTime, formatDate,
  getActivityColor, getNetOperatingTime, getGrossProductiveTime, getTotalShiftTime,
  getStatusVariant,
} from '@/lib/utils';
import { spacing, radius } from '@/lib/theme';
import type { ThemeColors } from '@/lib/theme';

type SectionKey = 'operators' | 'time' | 'activity' | 'timeline' | 'travel' | 'meter' | 'fuel' | 'remarks' | 'record';

export default function DeurDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const deur = mockRepository.getDeurById(id);
  if (!deur) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <PageHeader title="DEUR Details" onBack={() => router.back()} />
        <EmptyState title="Record not found" message="This DEUR record could not be found." />
      </View>
    );
  }

  const equipment = mockRepository.getEquipment(deur.equipmentId);
  const project = mockRepository.getProject(deur.projectId);
  const rental = mockRepository.getRental(deur.rentalId);
  const assignment = mockRepository.getAssignmentForDeur(deur.id);
  const hasOdometer = equipment?.hasOdometer ?? false;
  const netOp = getNetOperatingTime(deur);
  const grossProd = getGrossProductiveTime(deur);
  const totalShift = getTotalShiftTime(deur);
  const isRejected = deur.status === 'Rejected';
  const calculatedClosing = mockRepository.getCalculatedClosingMeter(id);
  const legs = mockRepository.getTravelLegs(id);
  const totalDistance = mockRepository.getTravelDistance(id);
  const totalFuel = mockRepository.getTotalFuelIssued(id);

  const toggle = (key: SectionKey) => setOpenSection(openSection === key ? null : key);

  const sections: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
    { key: 'operators', label: 'Operator Trail', icon: <Users size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'time', label: 'Time Summary', icon: <Clock size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'activity', label: 'Activity Breakdown', icon: <Activity size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'timeline', label: 'Activity Timeline', icon: <Clock size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'travel', label: 'Travel Trail', icon: <Navigation size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'meter', label: 'Meter & Odometer', icon: <Gauge size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'fuel', label: 'Fuel Log', icon: <Fuel size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'remarks', label: 'Remarks & Breakdown', icon: <MessageSquare size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'record', label: 'Record Details', icon: <FileText size={16} color={c.textSecondary} strokeWidth={2} /> },
  ];

  const renderSection = (key: SectionKey) => {
    switch (key) {
      case 'operators':
        return (
          <View style={styles.sectionContent}>
            {deur.operatorSegments.map((seg, idx) => (
              <View key={seg.id}>
                <View style={styles.segmentRow}>
                  <View style={[styles.segmentDot, { backgroundColor: seg.isReliever ? c.amber500 : c.blue600 }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.segmentName, { color: c.textPrimary }]}>{seg.operatorName}{seg.isReliever ? ' (Reliever)' : ''}</Text>
                    <Text style={[styles.segmentTime, { color: c.textMuted }]}>{formatTime(seg.startTime)} – {seg.endTime ? formatTime(seg.endTime) : 'Active'}</Text>
                  </View>
                </View>
                {idx < deur.operatorSegments.length - 1 && <View style={[styles.divider, { backgroundColor: c.slate100 }]} />}
              </View>
            ))}
          </View>
        );
      case 'time':
        return (
          <View style={styles.sectionContent}>
            <DetailRow label="Net Operating Time" value={formatDuration(netOp)} c={c} />
            <DetailRow label="Gross Productive Time" value={formatDuration(grossProd)} c={c} />
            <DetailRow label="Total Shift Time" value={formatDuration(totalShift)} c={c} />
          </View>
        );
      case 'activity':
        return (
          <View style={styles.sectionContent}>
            {(Object.entries(getActivityTotals(deur)) as [string, number][]).map(([act, ms]) => (
              <View key={act} style={styles.barRow}>
                <View style={styles.barRowHeader}>
                  <Text style={[styles.barRowLabel, { color: c.textSecondary }]}>{act}</Text>
                  <Text style={[styles.barRowValue, { color: c.textPrimary }]}>{formatDuration(ms)}</Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: c.slate200 }]}>
                  <View style={[styles.bar, { width: `${totalShift > 0 ? (ms / totalShift) * 100 : 0}%`, backgroundColor: getActivityColor(act) }]} />
                </View>
              </View>
            ))}
          </View>
        );
      case 'timeline':
        return (
          <View style={styles.sectionContent}>
            {deur.activities.map((event, idx) => (
              <View key={event.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: getActivityColor(event.activity) }]} />
                {idx < deur.activities.length - 1 && <View style={[styles.timelineLine, { backgroundColor: c.slate200 }]} />}
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineActivity, { color: c.textPrimary }]}>{event.activity}</Text>
                  {event.reason ? <Text style={[styles.timelineReason, { color: c.textMuted }]}>{event.reason}</Text> : null}
                  {event.category ? <Text style={[styles.timelineReason, { color: c.textMuted }]}>{event.category}</Text> : null}
                  <Text style={[styles.timelineTime, { color: c.textMuted }]}>{formatTime(event.startTime)} – {event.endTime ? formatTime(event.endTime) : 'Current'}</Text>
                </View>
                {event.endTime && <Text style={[styles.timelineDuration, { color: c.textSecondary }]}>{formatDurationShort(event.durationMs)}</Text>}
              </View>
            ))}
          </View>
        );
      case 'travel':
        return (
          <View style={styles.sectionContent}>
            {deur.travelCheckpoints.length === 0 ? (
              <Text style={[styles.noData, { color: c.textMuted }]}>No travel checkpoints recorded</Text>
            ) : (
              <>
                {deur.travelCheckpoints.map((cp, idx) => (
                  <View key={cp.id} style={styles.checkpointItem}>
                    <View style={[styles.checkpointDot, { backgroundColor: cp.operatorIsReliever ? c.amber500 : c.blue600 }]} />
                    {idx < deur.travelCheckpoints.length - 1 && <View style={[styles.timelineLine, { backgroundColor: c.slate200 }]} />}
                    <View style={styles.timelineContent}>
                      <Text style={[styles.checkpointType, { color: c.textMuted }]}>{cp.type === 'Initial' ? 'INITIAL' : `CHECKPOINT ${cp.seq}`}</Text>
                      <Text style={[styles.checkpointName, { color: c.textPrimary }]}>{cp.locationName}</Text>
                      <Text style={[styles.checkpointMeta, { color: c.textMuted }]}>{formatTime(cp.timestamp)} • {cp.operatorDisplayName}{cp.operatorIsReliever ? ' (Reliever)' : ''}</Text>
                      {cp.odometer != null && <Text style={[styles.checkpointOdo, { color: c.blue600 }]}>Odometer: {cp.odometer.toLocaleString()} km</Text>}
                      {cp.odometer == null && cp.odometerExceptionReason && <Text style={[styles.checkpointOdo, { color: c.amber500 }]}>Odo Unavailable: {cp.odometerExceptionReason}</Text>}
                      {cp.gps && <Text style={[styles.checkpointGps, { color: c.emerald500 }]}>GPS: {cp.gps.lat.toFixed(5)}, {cp.gps.lng.toFixed(5)}</Text>}
                    </View>
                  </View>
                ))}
                {totalDistance != null && <DetailRow label="Total Distance" value={`${totalDistance.toLocaleString()} km`} c={c} highlight />}
              </>
            )}
          </View>
        );
      case 'meter':
        return (
          <View style={styles.sectionContent}>
            <DetailRow label="Opening Hour Meter" value={deur.openingMeter != null ? `${deur.openingMeter.toLocaleString()} h` : 'Not Available'} c={c} />
            <DetailRow label="Calculated Closing" value={calculatedClosing != null ? `${calculatedClosing.toLocaleString()} h` : 'Not Available'} c={c} highlight />
            <DetailRow label="Net Operating Hours" value={`${(netOp / 3600000).toFixed(2)} h`} c={c} />
            {hasOdometer && (
              <>
                <DetailRow label="Opening Odometer" value={deur.openingOdometer != null ? `${deur.openingOdometer.toLocaleString()} km` : '---'} c={c} />
                <DetailRow label="Closing Odometer" value={deur.closingOdometer != null ? `${deur.closingOdometer.toLocaleString()} km` : '---'} c={c} />
                {totalDistance != null && <DetailRow label="Distance Travelled" value={`${totalDistance.toLocaleString()} km`} c={c} highlight />}
              </>
            )}
          </View>
        );
      case 'fuel': {
        const effEntries = mockRepository.getFuelEfficiencyEntries(id);
        return (
          <View style={styles.sectionContent}>
            {deur.fuelEntries.length === 0 ? (
              <Text style={[styles.noData, { color: c.textMuted }]}>No fuel transactions recorded</Text>
            ) : (
              <>
                <DetailRow label="Total Fuel Issued" value={`${totalFuel.toLocaleString()} L`} c={c} highlight />
                {deur.fuelEntries.map((f, i) => {
                  const eff = effEntries.find((e) => e.fuelEntry.id === f.id);
                  return (
                    <View key={f.id}>
                      <View style={[styles.fuelRow, { borderBottomColor: c.slate100 }]}>
                        <Fuel size={14} color={c.blue600} strokeWidth={2} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fuelAdded, { color: c.textPrimary }]}>{f.fuelAdded} L added</Text>
                          <Text style={[styles.fuelOperator, { color: c.textMuted }]}>{f.operatorName} • {formatTime(f.timestamp)}</Text>
                          {f.gaugeBefore != null && <Text style={[styles.fuelGauge, { color: c.textMuted }]}>Before: {f.gaugeBefore}%</Text>}
                          {f.gaugeAfter != null && <Text style={[styles.fuelGauge, { color: c.textMuted }]}>After: {f.gaugeAfter}%</Text>}
                          {f.fuelSlipNumber && <Text style={[styles.fuelGauge, { color: c.textMuted }]}>Slip: {f.fuelSlipNumber}</Text>}
                          {f.odometer != null && <Text style={[styles.fuelGauge, { color: c.blue600 }]}>Odo: {f.odometer.toLocaleString()} km</Text>}
                          {f.odometer == null && f.odometerExceptionReason && <Text style={[styles.fuelGauge, { color: c.amber500 }]}>Odo Unavailable: {f.odometerExceptionReason}</Text>}
                          {eff && eff.distance != null && <Text style={[styles.fuelGauge, { color: c.textSecondary }]}>Distance: {eff.distance.toLocaleString()} km</Text>}
                          {eff && eff.efficiency != null && <Text style={[styles.fuelEfficiency, { color: c.emerald500 }]}>Efficiency: {eff.efficiency.toFixed(2)} km/L</Text>}
                          {eff && eff.warning && <Text style={[styles.fuelWarning, { color: c.amber500 }]}>{eff.warning}</Text>}
                          {f.remarks && <Text style={[styles.fuelRemarks, { color: c.textMuted }]}>{f.remarks}</Text>}
                        </View>
                      </View>
                      {i < deur.fuelEntries.length - 1 && <View style={[styles.divider, { backgroundColor: c.slate100 }]} />}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        );
      }
      case 'remarks':
        return (
          <View style={styles.sectionContent}>
            <Text style={[styles.remarkLabel, { color: c.textSecondary }]}>General Remarks</Text>
            <Text style={[styles.remarkText, { color: c.textPrimary }]}>{deur.remarks || 'No remarks recorded'}</Text>
            {deur.breakdownRemarks ? (
              <>
                <View style={[styles.breakdownHeader, { borderTopColor: c.slate100 }]}>
                  <AlertTriangle size={14} color={c.red500} strokeWidth={2} />
                  <Text style={[styles.breakdownLabel, { color: c.red500 }]}>Breakdown Details</Text>
                </View>
                <Text style={[styles.remarkText, { color: c.textPrimary }]}>{deur.breakdownRemarks}</Text>
              </>
            ) : null}
          </View>
        );
      case 'record':
        return (
          <View style={styles.sectionContent}>
            <DetailRow label="DEUR ID" value={deur.id} c={c} />
            <DetailRow label="Equipment ID" value={deur.equipmentId} c={c} />
            <DetailRow label="Rental ID" value={deur.rentalId} c={c} />
            <DetailRow label="Project ID" value={deur.projectId} c={c} />
            {assignment && <DetailRow label="Assignment ID" value={assignment.id} c={c} />}
            {equipment && <DetailRow label="Equipment UUID" value={equipment.id} c={c} />}
            <Text style={[styles.recordHint, { color: c.textMuted }]}>Technical identifiers for administrative reference only.</Text>
          </View>
        );
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <PageHeader title="DEUR Details" onBack={() => router.back()} />
      <View style={styles.content}>
        {isRejected && (
          <View style={[styles.rejectedBanner, { backgroundColor: c.dangerBg }]}>
            <AlertTriangle size={18} color={c.red500} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rejectedTitle, { color: c.red500 }]}>This DEUR was rejected</Text>
              {deur.rejectionReason && <Text style={[styles.rejectedReason, { color: c.red500 }]}>{deur.rejectionReason}</Text>}
            </View>
          </View>
        )}

        {/* Compact Header */}
        <Card>
          <View style={styles.compactHeader}>
            <View style={styles.compactHeaderTop}>
              <Text style={[styles.deurNumber, { color: c.blue600 }]}>{deur.deurNumber}</Text>
              <StatusChip label={deur.status.toUpperCase()} variant={getStatusVariant(deur.status)} />
            </View>
            <View style={styles.compactEquipmentRow}>
              <View style={[styles.equipmentIcon, { backgroundColor: c.blue50 }]}>
                <Truck size={18} color={c.blue600} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.equipmentName, { color: c.textPrimary }]}>{equipment?.name ?? '---'}</Text>
                <Text style={[styles.assetNumber, { color: c.textMuted }]}>{equipment?.assetNumber ?? '---'} • {formatDate(deur.date)}</Text>
              </View>
            </View>
            <View style={styles.compactMetrics}>
              <View style={styles.compactMetric}>
                <Text style={[styles.compactMetricLabel, { color: c.textMuted }]}>Net Operation</Text>
                <Text style={[styles.compactMetricValue, { color: c.emerald500 }]}>{formatDuration(netOp)}</Text>
              </View>
              <View style={[styles.compactMetricDivider, { backgroundColor: c.slate100 }]} />
              <View style={styles.compactMetric}>
                <Text style={[styles.compactMetricLabel, { color: c.textMuted }]}>Total Shift</Text>
                <Text style={[styles.compactMetricValue, { color: c.blue600 }]}>{formatDuration(totalShift)}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Accordion sections */}
        {sections.map((s) => (
          <View key={s.key} style={[styles.accordionItem, { backgroundColor: c.surface, borderColor: c.surfaceBorder }]}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggle(s.key)} activeOpacity={0.7}>
              <View style={styles.accordionHeaderLeft}>
                {s.icon}
                <Text style={[styles.accordionLabel, { color: c.textPrimary }]}>{s.label}</Text>
              </View>
              {openSection === s.key
                ? <ChevronUp size={18} color={c.textMuted} strokeWidth={2} />
                : <ChevronDown size={18} color={c.textMuted} strokeWidth={2} />}
            </TouchableOpacity>
            {openSection === s.key && renderSection(s.key)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function getActivityTotals(deur: import('@/lib/types').Deur) {
  const totals: Record<string, number> = { Operating: 0, Waiting: 0, Breakdown: 0, 'Meal Break': 0 };
  for (const a of deur.activities) {
    const dur = a.endTime !== null ? a.durationMs : Date.now() - new Date(a.startTime).getTime();
    if (a.activity in totals) totals[a.activity] += dur;
  }
  return totals;
}

function DetailRow({ label, value, c, highlight }: { label: string; value: string; c: ThemeColors; highlight?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: highlight ? c.blue600 : c.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  rejectedBanner: { flexDirection: 'row', gap: 12, borderRadius: radius.md, padding: spacing.md, alignItems: 'flex-start' },
  rejectedTitle: { fontFamily: 'Manrope-Bold', fontSize: 14 },
  rejectedReason: { fontFamily: 'Manrope-Regular', fontSize: 13, marginTop: 2 },
  compactHeader: { gap: spacing.md },
  compactHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deurNumber: { fontFamily: 'Manrope-ExtraBold', fontSize: 18 },
  compactEquipmentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  equipmentIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  equipmentName: { fontFamily: 'Manrope-Bold', fontSize: 15 },
  assetNumber: { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 2 },
  compactMetrics: { flexDirection: 'row', borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0.03)', paddingVertical: spacing.md },
  compactMetric: { flex: 1, alignItems: 'center', gap: 2 },
  compactMetricDivider: { width: 1, height: '70%' },
  compactMetricLabel: { fontFamily: 'Manrope-Regular', fontSize: 12 },
  compactMetricValue: { fontFamily: 'Manrope-Bold', fontSize: 16 },
  divider: { height: 1, marginVertical: 8 },
  accordionItem: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md + 2, paddingHorizontal: spacing.md, minHeight: 52 },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  accordionLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 15 },
  sectionContent: { padding: spacing.md, paddingTop: 0, gap: 6 },
  segmentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  segmentDot: { width: 10, height: 10, borderRadius: 5 },
  segmentName: { fontFamily: 'Manrope-Bold', fontSize: 13 },
  segmentTime: { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  detailLabel: { fontFamily: 'Manrope-Regular', fontSize: 13 },
  detailValue: { fontFamily: 'Manrope-Bold', fontSize: 13 },
  barRow: { gap: 4, paddingVertical: 4 },
  barRowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  barRowLabel: { fontFamily: 'Manrope-Regular', fontSize: 13 },
  barRowValue: { fontFamily: 'Manrope-Bold', fontSize: 13 },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
  timelineItem: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { position: 'absolute', left: 4, top: 14, width: 2, bottom: -8 },
  timelineContent: { flex: 1, paddingBottom: 8 },
  timelineActivity: { fontFamily: 'Manrope-Bold', fontSize: 13 },
  timelineReason: { fontFamily: 'Manrope-Medium', fontSize: 12, marginTop: 1 },
  timelineTime: { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 2 },
  timelineDuration: { fontFamily: 'Manrope-Bold', fontSize: 12 },
  checkpointItem: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  checkpointDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  checkpointType: { fontFamily: 'Manrope-ExtraBold', fontSize: 10, letterSpacing: 0.5 },
  checkpointName: { fontFamily: 'Manrope-Bold', fontSize: 14, marginTop: 2 },
  checkpointMeta: { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 2 },
  checkpointOdo: { fontFamily: 'Manrope-SemiBold', fontSize: 12, marginTop: 1 },
  checkpointGps: { fontFamily: 'Manrope-Medium', fontSize: 12, marginTop: 1 },
  fuelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  fuelAdded: { fontFamily: 'Manrope-Bold', fontSize: 14 },
  fuelOperator: { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 1 },
  fuelGauge: { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 1 },
  fuelEfficiency: { fontFamily: 'Manrope-Bold', fontSize: 13, marginTop: 2 },
  fuelWarning: { fontFamily: 'Manrope-Medium', fontSize: 12, marginTop: 2 },
  fuelRemarks: { fontFamily: 'Manrope-Regular', fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  noData: { fontFamily: 'Manrope-Regular', fontSize: 13, paddingVertical: 8 },
  remarkLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 13, paddingVertical: 4 },
  remarkText: { fontFamily: 'Manrope-Regular', fontSize: 13, lineHeight: 20 },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderTopWidth: 1, marginTop: 8 },
  breakdownLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 13 },
  recordHint: { fontFamily: 'Manrope-Regular', fontSize: 11, fontStyle: 'italic', paddingTop: 8 },
});
