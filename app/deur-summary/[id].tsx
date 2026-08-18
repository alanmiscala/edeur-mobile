import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Truck, FileText, Clock, Gauge, Fuel, MessageSquare, AlertTriangle, Users } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { StatusChip } from '@/components/StatusChip';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SyncBanner } from '@/components/SyncBanner';
import { useConnectivity } from '@/lib/useConnectivity';
import {
  formatDuration,
  formatDurationShort,
  formatTime,
  formatDate,
  getActivityColor,
  getNetOperatingTime,
  getGrossProductiveTime,
  getTotalShiftTime,
} from '@/lib/utils';

export default function DeurSummaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const connectivity = useConnectivity();

  const deur = mockRepository.getDeurById(id);
  if (!deur) {
    return (
      <View style={styles.container}>
        <PageHeader title="DEUR Summary" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>DEUR record not found.</Text>
        </View>
      </View>
    );
  }

  const equipment = mockRepository.getEquipment(deur.equipmentId);
  const project = mockRepository.getProject(deur.projectId);
  const rental = mockRepository.getRental(deur.rentalId);
  const hasOdometer = equipment?.hasOdometer ?? false;
  const netOp = getNetOperatingTime(deur);
  const grossProd = getGrossProductiveTime(deur);
  const totalShift = getTotalShiftTime(deur);

  const isSubmitted = deur.status === 'Submitted' || deur.status === 'Acknowledged';
  const isRejected = deur.status === 'Rejected';
  const canSubmit = deur.status === 'Ended' && !isSubmitted;

  const handleSubmit = () => {
    const updated = mockRepository.submitDeur(deur.id);
    if (updated) {
      setShowSubmitConfirm(false);
      router.replace(`/deur-summary/${updated.id}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <PageHeader title="DEUR Summary" onBack={() => router.back()} />
      <View style={styles.content}>
        <SyncBanner status={connectivity} />

        {/* Status banner */}
        <View style={[styles.statusBanner, isSubmitted ? styles.submittedBanner : isRejected ? styles.rejectedBanner : styles.reviewBanner]}>
          <Text style={[styles.statusBannerText, isSubmitted ? styles.submittedText : isRejected ? styles.rejectedText : styles.reviewText]}>
            {isSubmitted
              ? deur.status === 'Acknowledged' ? 'DEUR Acknowledged' : 'Submitted — Awaiting Acknowledgement'
              : isRejected
                ? 'DEUR Rejected'
                : 'Review your report before submitting'}
          </Text>
          {isRejected && deur.rejectionReason && (
            <Text style={styles.rejectionReason}>{deur.rejectionReason}</Text>
          )}
        </View>

        {/* Shift info */}
        <Card style={styles.card}>
          <View style={styles.equipmentRow}>
            <View style={styles.equipmentIcon}>
              <Truck size={20} color={colors.blue600} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.equipmentName}>{equipment?.name ?? '---'}</Text>
              <Text style={styles.assetNumber}>{equipment?.assetNumber ?? '---'} • {rental?.rentalNumber ?? '---'}</Text>
            </View>
            <StatusChip
              label={deur.status.toUpperCase()}
              variant={isSubmitted ? 'blue' : isRejected ? 'red' : 'amber'}
            />
          </View>
          <View style={styles.infoGrid}>
            <InfoItem label="Shift Date" value={formatDate(deur.date)} />
            <InfoItem label="Project" value={project?.name ?? '---'} />
            <InfoItem label="Billing" value={rental?.billingMethod ?? '---'} />
            <InfoItem label="Shift Start" value={deur.shiftStart ? formatTime(deur.shiftStart) : '---'} />
            <InfoItem label="Shift End" value={deur.shiftEnd ? formatTime(deur.shiftEnd) : '---'} />
            <InfoItem label="Total Duration" value={formatDuration(totalShift)} />
          </View>
        </Card>

        {/* Operator Audit Trail */}
        {deur.operatorSegments.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>OPERATOR SCHEDULE</Text>
            <Card style={styles.card}>
              {deur.operatorSegments.map((seg, idx) => (
                <View key={seg.id}>
                  <View style={styles.segmentRow}>
                    <View style={[styles.segmentDot, { backgroundColor: seg.isReliever ? colors.amber500 : colors.blue600 }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.segmentName}>{seg.operatorName}{seg.isReliever ? ' (Reliever)' : ''}</Text>
                      <Text style={styles.segmentTime}>
                        {formatTime(seg.startTime)} – {seg.endTime ? formatTime(seg.endTime) : 'Active'}
                      </Text>
                    </View>
                  </View>
                  {idx < deur.operatorSegments.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Time Metrics */}
        <Text style={styles.sectionLabel}>TIME SUMMARY</Text>
        <Card style={styles.card}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Net Operating Time</Text>
            <Text style={styles.metricValue}>{formatDuration(netOp)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Gross Productive Time</Text>
            <Text style={styles.metricValue}>{formatDuration(grossProd)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Shift Time</Text>
            <Text style={styles.metricValue}>{formatDuration(totalShift)}</Text>
          </View>
        </Card>

        {/* Meter readings */}
        <Text style={styles.sectionLabel}>METER READINGS</Text>
        <Card style={styles.card}>
          <View style={styles.meterRow}>
            <Gauge size={16} color={colors.slate400} strokeWidth={2} />
            <Text style={styles.meterLabel}>Opening Hour Meter</Text>
            <Text style={styles.meterValue}>{deur.openingMeter != null ? `${deur.openingMeter.toLocaleString()} h` : '---'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.meterRow}>
            <Gauge size={16} color={colors.slate400} strokeWidth={2} />
            <Text style={styles.meterLabel}>Closing Hour Meter</Text>
            <Text style={styles.meterValue}>{deur.closingMeter != null ? `${deur.closingMeter.toLocaleString()} h` : '---'}</Text>
          </View>
          {hasOdometer && (
            <>
              <View style={styles.divider} />
              <View style={styles.meterRow}>
                <Gauge size={16} color={colors.slate400} strokeWidth={2} />
                <Text style={styles.meterLabel}>Opening Odometer</Text>
                <Text style={styles.meterValue}>{deur.openingOdometer != null ? `${deur.openingOdometer.toLocaleString()} km` : '---'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.meterRow}>
                <Gauge size={16} color={colors.slate400} strokeWidth={2} />
                <Text style={styles.meterLabel}>Closing Odometer</Text>
                <Text style={styles.meterValue}>{deur.closingOdometer != null ? `${deur.closingOdometer.toLocaleString()} km` : '---'}</Text>
              </View>
              {deur.openingOdometer != null && deur.closingOdometer != null && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.meterRow}>
                    <Text style={styles.meterLabel}>Distance Travelled</Text>
                    <Text style={[styles.meterValue, { color: colors.blue600 }]}>
                      {(deur.closingOdometer - deur.openingOdometer).toLocaleString()} km
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </Card>

        {/* Fuel entries */}
        <Text style={styles.sectionLabel}>FUEL</Text>
        <Card style={styles.card}>
          {deur.fuelEntries.length === 0 ? (
            <Text style={styles.noData}>No fuel entries recorded</Text>
          ) : (
            deur.fuelEntries.map((f, i) => (
              <View key={f.id}>
                <View style={styles.fuelRow}>
                  <Fuel size={16} color={colors.blue600} strokeWidth={2} />
                  <Text style={styles.fuelQty}>{f.quantity} L</Text>
                  {f.gaugeLevel && <Text style={styles.fuelGauge}>{f.gaugeLevel}</Text>}
                  <Text style={styles.fuelTime}>{formatTime(f.timestamp)}</Text>
                  {f.remarks ? <Text style={styles.fuelRemarks}>{f.remarks}</Text> : null}
                </View>
                {i < deur.fuelEntries.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </Card>

        {/* Remarks */}
        <Text style={styles.sectionLabel}>REMARKS</Text>
        <Card style={styles.card}>
          <View style={styles.remarkRow}>
            <MessageSquare size={16} color={colors.slate400} strokeWidth={2} />
            <Text style={styles.remarkLabel}>General Remarks</Text>
          </View>
          <Text style={styles.remarkText}>{deur.remarks || 'No remarks recorded'}</Text>
          {deur.breakdownRemarks ? (
            <>
              <View style={styles.divider} />
              <View style={styles.remarkRow}>
                <AlertTriangle size={16} color={colors.red500} strokeWidth={2} />
                <Text style={styles.remarkLabel}>Breakdown Notes</Text>
              </View>
              <Text style={styles.remarkText}>{deur.breakdownRemarks}</Text>
            </>
          ) : null}
        </Card>

        {/* Activity timeline */}
        <Text style={styles.sectionLabel}>ACTIVITY TIMELINE</Text>
        <Card style={styles.card}>
          {deur.activities.map((event, idx) => (
            <View key={event.id}>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: getActivityColor(event.activity) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineActivity}>{event.activity}</Text>
                  {event.reason && <Text style={styles.timelineReason}>{event.reason}</Text>}
                  {event.category && <Text style={styles.timelineReason}>{event.category}</Text>}
                  <Text style={styles.timelineTime}>
                    {formatTime(event.startTime)} – {event.endTime ? formatTime(event.endTime) : 'Current'}
                  </Text>
                </View>
                <Text style={styles.timelineDuration}>
                  {event.endTime ? formatDurationShort(event.durationMs) : '---'}
                </Text>
              </View>
              {idx < deur.activities.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        {/* Actions */}
        {canSubmit && (
          <View style={styles.actions}>
            <Button label="EDIT" onPress={() => router.push(`/deur-meter/${deur.id}`)} variant="secondary" style={styles.actionButton} />
            <Button label="SUBMIT DEUR" onPress={() => setShowSubmitConfirm(true)} style={styles.actionButton} />
          </View>
        )}

        {isSubmitted && (
          <Card style={styles.submittedCard}>
            <Text style={styles.submittedCardText}>
              This DEUR has been submitted and is no longer editable.
            </Text>
          </Card>
        )}

        {isRejected && (
          <Card style={styles.submittedCard}>
            <AlertTriangle size={20} color={colors.red500} strokeWidth={2} />
            <Text style={styles.submittedCardText}>
              This DEUR was rejected and may need correction.
            </Text>
          </Card>
        )}

        <ConfirmDialog
          visible={showSubmitConfirm}
          title="Submit DEUR?"
          message="Please verify all details are correct. Once submitted, this report cannot be edited. It will appear in your DEUR history."
          confirmLabel="Submit"
          onConfirm={handleSubmit}
          onCancel={() => setShowSubmitConfirm(false)}
        />
      </View>
    </ScrollView>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.slate500,
  },
  statusBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    gap: 4,
  },
  reviewBanner: {
    backgroundColor: colors.amber50,
  },
  submittedBanner: {
    backgroundColor: colors.emerald50,
  },
  rejectedBanner: {
    backgroundColor: colors.red50,
  },
  statusBannerText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  reviewText: {
    color: colors.amber500,
  },
  submittedText: {
    color: colors.emerald500,
  },
  rejectedText: {
    color: colors.red500,
  },
  rejectionReason: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.red500,
    textAlign: 'center',
  },
  card: {
    gap: 0,
    padding: 0,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  equipmentIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.slate900,
  },
  assetNumber: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  infoItem: {
    flexBasis: '50%',
    padding: 12,
    gap: 2,
  },
  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
  },
  infoValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.slate900,
  },
  sectionLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.slate500,
    letterSpacing: 0.5,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  segmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  segmentName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.slate900,
  },
  segmentTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  metricLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.slate700,
  },
  metricValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.slate900,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  meterLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.slate500,
  },
  meterValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.slate900,
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate100,
    marginLeft: 16,
  },
  noData: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate500,
    padding: 16,
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    flexWrap: 'wrap',
  },
  fuelQty: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.slate900,
  },
  fuelGauge: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.blue600,
  },
  fuelTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
  },
  fuelRemarks: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
    fontStyle: 'italic',
  },
  remarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    paddingBottom: 4,
  },
  remarkLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate700,
  },
  remarkText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate900,
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineActivity: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.slate900,
  },
  timelineReason: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  timelineTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  timelineDuration: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.slate700,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  submittedCard: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: 8,
  },
  submittedCardText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.slate500,
    textAlign: 'center',
  },
});
