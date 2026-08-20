import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { X, ChevronDown, ChevronUp, Truck, Clock, Gauge, Fuel, MessageSquare, Navigation, Users, TriangleAlert as AlertTriangle, Activity } from 'lucide-react-native';
import { useTheme } from '@/lib/useTheme';
import { mockRepository } from '@/lib/mockRepository';
import type { Deur, TravelCheckpoint } from '@/lib/types';
import { spacing, radius } from '@/lib/theme';
import { formatDuration, formatDurationShort, formatTime, formatDate, getActivityTotals, getActivityColor, getNetOperatingTime, getGrossProductiveTime, getTotalShiftTime } from '@/lib/utils';
import type { ThemeColors } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 380);

interface Props { visible: boolean; deur: Deur | null; onClose: () => void; onNavigate: (route: string) => void; }
type SectionKey = 'assignment' | 'operators' | 'time' | 'activity' | 'timeline' | 'meter' | 'fuel' | 'travel' | 'remarks';

export function DeurDetailsDrawer({ visible, deur, onClose, onNavigate }: Props) {
  const { colors: c } = useTheme();
  const [open, setOpen] = useState<SectionKey | null>(null);
  if (!deur) return null;

  const eq = mockRepository.getEquipment(deur.equipmentId);
  const proj = mockRepository.getProject(deur.projectId);
  const rental = mockRepository.getRental(deur.rentalId);
  const isActive = deur.status === 'Active';
  const totals = getActivityTotals(deur);
  const netOp = getNetOperatingTime(deur);
  const grossProd = getGrossProductiveTime(deur);
  const totalShift = getTotalShiftTime(deur);
  const calcClosing = mockRepository.getCalculatedClosingMeter(deur.id);
  const totalDist = mockRepository.getTravelDistance(deur.id);
  const totalFuel = mockRepository.getTotalFuelIssued(deur.id);
  const effEntries = mockRepository.getFuelEfficiencyEntries(deur.id);

  const sections: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
    { key: 'assignment', label: 'Assignment Details', icon: <Truck size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'operators', label: 'Operator Trail', icon: <Users size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'time', label: 'Time Summary', icon: <Clock size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'activity', label: 'Activity Breakdown', icon: <Activity size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'timeline', label: 'Activity Timeline', icon: <Clock size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'meter', label: 'Meter Summary', icon: <Gauge size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'fuel', label: 'Fuel Log', icon: <Fuel size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'travel', label: 'Travel Trail', icon: <Navigation size={16} color={c.textSecondary} strokeWidth={2} /> },
    { key: 'remarks', label: 'Remarks', icon: <MessageSquare size={16} color={c.textSecondary} strokeWidth={2} /> },
  ];

  const Row = ({ label, value, hl }: { label: string; value: string; hl?: boolean }) => (
    <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: c.textMuted }]}>{label}</Text><Text style={[styles.detailValue, { color: hl ? c.blue600 : c.textPrimary }]}>{value}</Text></View>
  );

  const renderContent = (key: SectionKey) => {
    switch (key) {
      case 'assignment': return <View style={styles.sectionContent}>
        <Row label="Equipment" value={eq?.name ?? '---'} /><Row label="Asset No." value={eq?.assetNumber ?? '---'} />
        <Row label="Rental" value={rental?.rentalNumber ?? '---'} /><Row label="Customer" value={rental?.customerName ?? '---'} />
        <Row label="Project" value={proj?.name ?? '---'} /><Row label="Billing" value={rental?.billingMethod ?? '---'} />
        <Row label="Date" value={formatDate(deur.date)} />
      </View>;
      case 'operators': return <View style={styles.sectionContent}>
        {deur.operatorSegments.map((seg, i) => (
          <View key={seg.id} style={styles.timelineItem}>
            <View style={[styles.tlDot, { backgroundColor: seg.isReliever ? c.amber500 : c.blue600 }]} />
            {i < deur.operatorSegments.length - 1 && <View style={[styles.tlLine, { backgroundColor: c.slate200 }]} />}
            <View style={{ flex: 1, paddingBottom: 8 }}>
              <Text style={[styles.tlActivity, { color: c.textPrimary }]}>{seg.operatorName}{seg.isReliever ? ' (Reliever)' : ''}</Text>
              <Text style={[styles.tlTime, { color: c.textMuted }]}>{formatTime(seg.startTime)} – {seg.endTime ? formatTime(seg.endTime) : 'Active'}</Text>
            </View>
          </View>
        ))}
      </View>;
      case 'time': return <View style={styles.sectionContent}>
        <Row label="Net Operating" value={formatDuration(netOp)} /><Row label="Gross Productive" value={formatDuration(grossProd)} /><Row label="Total Shift" value={formatDuration(totalShift)} />
      </View>;
      case 'activity': return <View style={styles.sectionContent}>
        {(Object.keys(totals) as (keyof typeof totals)[]).map((act) => (
          <View key={act} style={styles.barRow}>
            <View style={styles.barRowHeader}><Text style={[styles.barRowLabel, { color: c.textSecondary }]}>{act}</Text><Text style={[styles.barRowValue, { color: c.textPrimary }]}>{formatDuration(totals[act])}</Text></View>
            <View style={[styles.barBg, { backgroundColor: c.slate200 }]}><View style={[styles.bar, { width: `${totalShift > 0 ? (totals[act] / totalShift) * 100 : 0}%`, backgroundColor: getActivityColor(act) }]} /></View>
          </View>
        ))}
      </View>;
      case 'timeline': return <View style={styles.sectionContent}>
        {deur.activities.map((ev, i) => (
          <View key={ev.id} style={styles.timelineItem}>
            <View style={[styles.tlDot, { backgroundColor: getActivityColor(ev.activity) }]} />
            {i < deur.activities.length - 1 && <View style={[styles.tlLine, { backgroundColor: c.slate200 }]} />}
            <View style={{ flex: 1, paddingBottom: 8 }}>
              <Text style={[styles.tlActivity, { color: c.textPrimary }]}>{ev.activity}</Text>
              {ev.reason ? <Text style={[styles.tlReason, { color: c.textMuted }]}>{ev.reason}</Text> : null}
              {ev.category ? <Text style={[styles.tlReason, { color: c.textMuted }]}>{ev.category}</Text> : null}
              <Text style={[styles.tlTime, { color: c.textMuted }]}>{formatTime(ev.startTime)} – {ev.endTime ? formatTime(ev.endTime) : 'Current'}</Text>
            </View>
            {ev.endTime ? <Text style={[styles.tlDur, { color: c.textSecondary }]}>{formatDurationShort(ev.durationMs)}</Text> : null}
          </View>
        ))}
      </View>;
      case 'meter': return <View style={styles.sectionContent}>
        <Row label="Opening Hour Meter" value={deur.openingMeter != null ? `${deur.openingMeter.toLocaleString()} h` : 'Not Available'} />
        <Row label="Calculated Closing" value={calcClosing != null ? `${calcClosing.toLocaleString()} h` : 'Not Available'} hl />
        <Row label="Net Operating Hours" value={`${(netOp / 3600000).toFixed(2)} h`} />
        {eq?.hasOdometer && <Row label="Opening Odometer" value={deur.openingOdometer != null ? `${deur.openingOdometer.toLocaleString()} km` : 'Not Available'} />}
      </View>;
      case 'fuel': return <View style={styles.sectionContent}>
        {deur.fuelEntries.length === 0 ? <Text style={[styles.noData, { color: c.textMuted }]}>No fuel transactions</Text> :
          <><Row label="Total Fuel Issued" value={`${totalFuel.toLocaleString()} L`} hl />
          {deur.fuelEntries.map((f) => {
            const eff = effEntries.find((e) => e.fuelEntry.id === f.id);
            return (
              <View key={f.id} style={[styles.fuelRow, { borderBottomColor: c.slate100 }]}>
                <Fuel size={14} color={c.blue600} strokeWidth={2} /><View style={{ flex: 1 }}>
                <Text style={[styles.fuelAdded, { color: c.textPrimary }]}>{f.fuelAdded} L</Text>
                <Text style={[styles.fuelMeta, { color: c.textMuted }]}>{f.operatorName} • {formatTime(f.timestamp)}</Text>
                {f.gaugeBefore != null && <Text style={[styles.fuelMeta, { color: c.textMuted }]}>Before: {f.gaugeBefore}%</Text>}
                {f.gaugeAfter != null && <Text style={[styles.fuelMeta, { color: c.textMuted }]}>After: {f.gaugeAfter}%</Text>}
                {f.odometer != null && <Text style={[styles.fuelMeta, { color: c.blue600 }]}>Odo: {f.odometer.toLocaleString()} km</Text>}
                {f.odometer == null && f.odometerExceptionReason && <Text style={[styles.fuelMeta, { color: c.amber500 }]}>Odo Unavailable: {f.odometerExceptionReason}</Text>}
                {eff && eff.efficiency != null && <Text style={[styles.fuelEff, { color: c.emerald500 }]}>Efficiency: {eff.efficiency.toFixed(2)} km/L</Text>}
                {f.remarks ? <Text style={[styles.fuelMeta, { color: c.textMuted, fontStyle: 'italic' }]}>{f.remarks}</Text> : null}
                </View>
              </View>
            );
          })}</>}
        {isActive && <TouchableOpacity style={[styles.editBtn, { borderColor: c.blue600 }]} onPress={() => onNavigate(`/deur-fuel/${deur.id}`)}><Text style={[styles.editBtnText, { color: c.blue600 }]}>Add Fuel Transaction</Text></TouchableOpacity>}
      </View>;
      case 'travel': return <View style={styles.sectionContent}>
        {deur.travelCheckpoints.length === 0 ? <Text style={[styles.noData, { color: c.textMuted }]}>No travel checkpoints</Text> :
          <>{deur.travelCheckpoints.map((chk: TravelCheckpoint, i: number) => (
            <View key={chk.id} style={styles.timelineItem}>
              <View style={[styles.tlDot, { backgroundColor: chk.operatorIsReliever ? c.amber500 : c.blue600 }]} />
              {i < deur.travelCheckpoints.length - 1 && <View style={[styles.tlLine, { backgroundColor: c.slate200 }]} />}
              <View style={{ flex: 1, paddingBottom: 8 }}>
                <Text style={[styles.tlActivity, { color: c.textPrimary }]}>{chk.locationName}</Text>
                <Text style={[styles.tlTime, { color: c.textMuted }]}>{formatTime(chk.timestamp)} • {chk.operatorDisplayName}{chk.operatorIsReliever ? ' (Reliever)' : ''}</Text>
                {chk.odometer != null && <Text style={[styles.tlReason, { color: c.blue600 }]}>Odometer: {chk.odometer.toLocaleString()} km</Text>}
                {chk.odometer == null && chk.odometerExceptionReason && <Text style={[styles.tlReason, { color: c.amber500 }]}>Odo Unavailable: {chk.odometerExceptionReason}</Text>}
                {chk.gps && <Text style={[styles.tlReason, { color: c.emerald500 }]}>GPS: {chk.gps.lat.toFixed(5)}, {chk.gps.lng.toFixed(5)}</Text>}
                <Text style={[styles.tlReason, { color: c.textMuted }]}>{chk.locationSource} • Checkpoint {chk.seq}</Text>
              </View>
            </View>
          ))}
          {totalDist != null && <Row label="Total Distance" value={`${totalDist.toLocaleString()} km`} hl />}
          {mockRepository.hasOdometerGaps(deur.id) && <Text style={[styles.gapWarning, { color: c.amber500 }]}>ODOMETER DATA INCOMPLETE</Text>}</>}
        {isActive && <TouchableOpacity style={[styles.editBtn, { borderColor: c.blue600 }]} onPress={() => onNavigate(`/deur-travel/${deur.id}`)}><Text style={[styles.editBtnText, { color: c.blue600 }]}>{deur.travelCheckpoints.length === 0 ? 'Record Initial Location' : 'Add Checkpoint'}</Text></TouchableOpacity>}
      </View>;
      case 'remarks': return <View style={styles.sectionContent}>
        <Row label="General Remarks" value={deur.remarks || 'No remarks'} />
        {deur.breakdownRemarks ? <><View style={[styles.bdHeader, { borderTopColor: c.slate100 }]}><AlertTriangle size={14} color={c.red500} strokeWidth={2} /><Text style={[styles.bdLabel, { color: c.red500 }]}>Breakdown Details</Text></View><Text style={[styles.remarkText, { color: c.textPrimary }]}>{deur.breakdownRemarks}</Text></> : null}
        {isActive && <TouchableOpacity style={[styles.editBtn, { borderColor: c.blue600 }]} onPress={() => onNavigate(`/deur-remarks/${deur.id}`)}><Text style={[styles.editBtnText, { color: c.blue600 }]}>Edit Remarks</Text></TouchableOpacity>}
      </View>;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[styles.drawer, { backgroundColor: c.background }]} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.drawerHeader, { backgroundColor: c.surface, borderBottomColor: c.surfaceBorder }]}>
            <Text style={[styles.drawerTitle, { color: c.textPrimary }]}>DEUR Details</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={22} color={c.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.drawerBody} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
            {sections.map((s) => (
              <View key={s.key} style={[styles.accordion, { backgroundColor: c.surface, borderColor: c.surfaceBorder }]}>
                <TouchableOpacity style={styles.accHeader} onPress={() => setOpen(open === s.key ? null : s.key)} activeOpacity={0.7}>
                  <View style={styles.accHeaderLeft}>{s.icon}<Text style={[styles.accLabel, { color: c.textPrimary }]}>{s.label}</Text></View>
                  {open === s.key ? <ChevronUp size={18} color={c.textMuted} strokeWidth={2} /> : <ChevronDown size={18} color={c.textMuted} strokeWidth={2} />}
                </TouchableOpacity>
                {open === s.key && renderContent(s.key)}
              </View>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', justifyContent: 'flex-end' },
  drawer: { width: Math.min(Dimensions.get('window').width * 0.85, 380), height: '100%', overflow: 'hidden' },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  drawerTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 18 },
  drawerBody: { flex: 1, padding: 12 },
  accordion: { borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  accHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, minHeight: 52 },
  accHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  accLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 15 },
  sectionContent: { padding: 12, paddingTop: 0, gap: 6 },
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
  tlDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  tlLine: { position: 'absolute', left: 4, top: 14, width: 2, bottom: -8 },
  tlActivity: { fontFamily: 'Manrope-Bold', fontSize: 13 },
  tlReason: { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 1 },
  tlTime: { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 2 },
  tlDur: { fontFamily: 'Manrope-Bold', fontSize: 12 },
  fuelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  fuelAdded: { fontFamily: 'Manrope-Bold', fontSize: 14 },
  fuelMeta: { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 1 },
  fuelEff: { fontFamily: 'Manrope-Bold', fontSize: 12, marginTop: 1 },
  noData: { fontFamily: 'Manrope-Regular', fontSize: 13, paddingVertical: 8 },
  editBtn: { borderWidth: 1.5, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  editBtnText: { fontFamily: 'Manrope-Bold', fontSize: 13 },
  bdHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderTopWidth: 1 },
  bdLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 13 },
  remarkText: { fontFamily: 'Manrope-Regular', fontSize: 13, lineHeight: 20 },
  gapWarning: { fontFamily: 'Manrope-ExtraBold', fontSize: 11, letterSpacing: 0.5, paddingTop: 6 },
});
