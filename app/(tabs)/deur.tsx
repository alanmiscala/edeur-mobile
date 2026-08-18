import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, Clock, Fuel, Gauge, MessageSquare, AlertTriangle, Square, Users, MapPin } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { mockRepository } from '@/lib/mockRepository';
import type { ActivityType, Deur } from '@/lib/types';
import { Card } from '@/components/Card';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SyncBanner } from '@/components/SyncBanner';
import { useConnectivity } from '@/lib/useConnectivity';
import {
  formatDuration,
  formatTime,
  formatDate,
  getActivityTotals,
  getCurrentActivity,
  getActivityColor,
  getNetOperatingTime,
  getGrossProductiveTime,
  getTotalShiftTime,
} from '@/lib/utils';

const ACTIVITIES: { type: ActivityType; color: string; bgColor: string }[] = [
  { type: 'Operating', color: colors.emerald500, bgColor: colors.emerald50 },
  { type: 'Waiting', color: colors.amber500, bgColor: colors.amber100 },
  { type: 'Breakdown', color: colors.red500, bgColor: colors.red50 },
];

export default function DeurScreen() {
  const router = useRouter();
  const { operator } = useAuth();
  const [deur, setDeur] = useState<Deur | null>(null);
  const [, setTick] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showTurnOverConfirm, setShowTurnOverConfirm] = useState(false);
  const [waitingModalVisible, setWaitingModalVisible] = useState(false);
  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [breakdownRemarks, setBreakdownRemarks] = useState('');
  const connectivity = useConnectivity();

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshDeur = useCallback(() => {
    if (!operator) return;
    const rental = mockRepository.getRentalForOperator(operator.id);
    if (!rental) {
      const activeDeur = mockRepository.getActiveDeurForRental('');
      setDeur(null);
      return;
    }
    let d = mockRepository.getDeurForToday(operator.id, rental.id);
    if (!d) {
      d = mockRepository.getActiveDeurForRental(rental.id) ?? null;
    }
    setDeur(d ? { ...d, activities: [...d.activities], fuelEntries: [...d.fuelEntries], operatorSegments: [...d.operatorSegments] } : null);
  }, [operator]);

  useEffect(() => {
    refreshDeur();
  }, [refreshDeur]);

  if (!operator) return null;

  const assignment = mockRepository.getOperatorAssignment(operator.id);
  const equipment = assignment ? mockRepository.getEquipment(assignment.equipmentId) : null;
  const project = assignment ? mockRepository.getProject(assignment.projectId) : null;
  const rental = mockRepository.getRentalForOperator(operator.id);

  const handleStart = () => {
    if (!operator || !assignment || !rental) return;
    const d = mockRepository.createDeur({
      operatorId: operator.id,
      operatorName: operator.name,
      equipmentId: assignment.equipmentId,
      assignmentId: assignment.id,
      rentalId: rental.id,
      projectId: assignment.projectId,
      openingMeter: equipment?.hourMeter ?? null,
      openingOdometer: equipment?.hasOdometer ? equipment.hourMeter : null,
    });
    setDeur({ ...d });
    setShowStartConfirm(false);
  };

  const handleActivityPress = (activity: ActivityType) => {
    if (!deur) return;
    if (activity === 'Waiting') {
      setWaitingModalVisible(true);
    } else if (activity === 'Breakdown') {
      setBreakdownRemarks('');
      setBreakdownModalVisible(true);
    } else {
      const updated = mockRepository.startActivity(deur.id, activity);
      if (updated) setDeur({ ...updated, activities: [...updated.activities] });
    }
  };

  const handleWaitingReasonSelect = (reason: string) => {
    if (!deur) return;
    const updated = mockRepository.startActivity(deur.id, 'Waiting', reason);
    if (updated) setDeur({ ...updated, activities: [...updated.activities] });
    setWaitingModalVisible(false);
  };

  const handleBreakdownCategorySelect = (category: string) => {
    if (!deur) return;
    const updated = mockRepository.startActivity(deur.id, 'Breakdown', undefined, category);
    if (updated) setDeur({ ...updated, activities: [...updated.activities] });
    setBreakdownModalVisible(false);
    setBreakdownRemarks('');
  };

  const handleEndShift = () => {
    if (!deur) return;
    const updated = mockRepository.endShift(deur.id);
    if (updated) {
      setDeur({ ...updated, activities: [...updated.activities], operatorSegments: [...updated.operatorSegments] });
      setShowEndConfirm(false);
      router.push(`/deur-summary/${updated.id}`);
    }
  };

  const handleTurnOver = () => {
    setShowTurnOverConfirm(false);
    router.push('/reliever-login');
  };

  if (!equipment || !project || !rental) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No active assignment found.</Text>
      </View>
    );
  }

  // No DEUR yet - show start screen
  if (!deur) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Digital DEUR</Text>
          <Text style={styles.screenSubtitle}>Daily Equipment Utilization Report</Text>
        </View>

        <SyncBanner status={connectivity} />

        <Card style={styles.infoCard}>
          <View style={styles.equipmentRow}>
            <View style={styles.equipmentIcon}>
              <Truck size={20} color={colors.blue600} strokeWidth={2} />
            </View>
            <View style={styles.equipmentInfo}>
              <Text style={styles.equipmentName}>{equipment.name}</Text>
              <Text style={styles.assetNumber}>{equipment.assetNumber}</Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rental</Text>
              <Text style={styles.infoValue}>{rental.rentalNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Billing</Text>
              <Text style={styles.infoValue}>{rental.billingMethod}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Project</Text>
              <Text style={styles.infoValue}>{project.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Operator</Text>
              <Text style={styles.infoValue}>{operator.name}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.meterCard}>
          <View style={styles.meterRow}>
            <Gauge size={18} color={colors.slate400} strokeWidth={2} />
            <Text style={styles.meterLabel}>Opening Hour Meter</Text>
            <Text style={styles.meterValue}>{equipment.hourMeter.toLocaleString()} h</Text>
          </View>
        </Card>

        <View style={styles.startSection}>
          <Text style={styles.startHint}>No DEUR has been started for today.</Text>
          <Text style={styles.startHintSub}>
            Starting a shift will create a new DEUR record and begin tracking your activity.
          </Text>
          <Button label="START DEUR" onPress={() => setShowStartConfirm(true)} style={styles.ctaButton} />
        </View>

        <ConfirmDialog
          visible={showStartConfirm}
          title="Start DEUR?"
          message="This will begin a new shift and start tracking your equipment activity for today."
          confirmLabel="Start Shift"
          onConfirm={handleStart}
          onCancel={() => setShowStartConfirm(false)}
        />
      </ScrollView>
    );
  }

  // Active or ended DEUR
  const totals = getActivityTotals(deur);
  const currentActivity = getCurrentActivity(deur);
  const isActive = deur.status === 'Active';
  const netOp = getNetOperatingTime(deur);
  const grossProd = getGrossProductiveTime(deur);
  const totalShift = getTotalShiftTime(deur);
  const waitingReasons = mockRepository.getWaitingReasons();
  const breakdownCategories = mockRepository.getBreakdownCategories();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SyncBanner status={connectivity} />

      {/* Header info */}
      <Card style={styles.infoCard}>
        <View style={styles.equipmentRow}>
          <View style={styles.equipmentIcon}>
            <Truck size={20} color={colors.blue600} strokeWidth={2} />
          </View>
          <View style={styles.equipmentInfo}>
            <Text style={styles.equipmentName}>{equipment.name}</Text>
            <Text style={styles.assetNumber}>{equipment.assetNumber} • {rental.rentalNumber}</Text>
          </View>
          <StatusChip
            label={deur.status.toUpperCase()}
            variant={isActive ? 'emerald' : deur.status === 'Submitted' || deur.status === 'Acknowledged' ? 'blue' : deur.status === 'Rejected' ? 'red' : 'amber'}
          />
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Project</Text>
            <Text style={styles.infoValue}>{project.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Billing</Text>
            <Text style={styles.infoValue}>{rental.billingMethod}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(deur.date)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Shift Start</Text>
            <Text style={styles.infoValue}>{deur.shiftStart ? formatTime(deur.shiftStart) : '---'}</Text>
          </View>
        </View>
      </Card>

      {/* Operator Segments / Audit Trail */}
      {deur.operatorSegments.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>OPERATOR SCHEDULE</Text>
          <Card style={styles.timelineCard}>
            {deur.operatorSegments.map((seg, idx) => (
              <View key={seg.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: seg.isReliever ? colors.amber500 : colors.blue600 }]} />
                {idx < deur.operatorSegments.length - 1 && <View style={styles.timelineLine} />}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineActivity}>{seg.operatorName}{seg.isReliever ? ' (Reliever)' : ''}</Text>
                  <Text style={styles.timelineTime}>
                    {formatTime(seg.startTime)} – {seg.endTime ? formatTime(seg.endTime) : 'Active'}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Current Activity Card */}
      {currentActivity && isActive && (
        <Card style={[styles.currentActivityCard, { borderColor: currentActivity.activity === 'Breakdown' ? colors.red500 : currentActivity.activity === 'Waiting' ? colors.amber500 : colors.emerald500 }] as unknown as ViewStyle}>
          <Text style={styles.currentActivityLabel}>CURRENT ACTIVITY</Text>
          <Text style={[styles.currentActivityName, { color: currentActivity.activity === 'Breakdown' ? colors.red500 : currentActivity.activity === 'Waiting' ? colors.amber500 : colors.emerald500 }]}>
            {currentActivity.activity.toUpperCase()}
          </Text>
          {currentActivity.reason && (
            <Text style={styles.currentActivityReason}>{currentActivity.reason}</Text>
          )}
          {currentActivity.category && (
            <Text style={styles.currentActivityReason}>{currentActivity.category}</Text>
          )}
          <View style={styles.runningRow}>
            <View style={styles.runningDot} />
            <Text style={styles.runningText}>Running for</Text>
            <Text style={styles.runningDuration}>
              {formatDuration(Date.now() - new Date(currentActivity.startTime).getTime())}
            </Text>
          </View>
        </Card>
      )}

      {/* Activity Buttons */}
      {isActive && (
        <>
          <Text style={styles.sectionLabel}>SELECT ACTIVITY</Text>
          <View style={styles.activityGrid}>
            {ACTIVITIES.map((act) => {
              const isCurrent = currentActivity?.activity === act.type;
              return (
                <TouchableOpacity
                  key={act.type}
                  onPress={() => handleActivityPress(act.type)}
                  style={[
                    styles.activityButton,
                    {
                      backgroundColor: isCurrent ? act.color : act.bgColor,
                      borderColor: isCurrent ? act.color : colors.slate200,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.activityButtonText,
                      { color: isCurrent ? colors.white : act.color },
                    ]}
                  >
                    {act.type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Time Metrics */}
      <Text style={styles.sectionLabel}>TIME SUMMARY</Text>
      <Card style={styles.totalsCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Net Operating Time</Text>
          <Text style={styles.metricValue}>{formatDuration(netOp)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Gross Productive Time</Text>
          <Text style={styles.metricValue}>{formatDuration(grossProd)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Shift Time</Text>
          <Text style={styles.metricValue}>{formatDuration(totalShift)}</Text>
        </View>
      </Card>

      {/* Activity Breakdown */}
      <Text style={styles.sectionLabel}>ACTIVITY BREAKDOWN</Text>
      <Card style={styles.totalsCard}>
        {ACTIVITIES.map((act) => {
          const total = totals[act.type];
          const pct = totalShift > 0 ? (total / totalShift) * 100 : 0;
          return (
            <View key={act.type} style={styles.totalRow}>
              <View style={styles.totalRowHeader}>
                <Text style={styles.totalRowLabel}>{act.type}</Text>
                <Text style={styles.totalRowValue}>{formatDuration(total)}</Text>
              </View>
              <View style={styles.totalBarBg}>
                <View style={[styles.totalBar, { width: `${pct}%`, backgroundColor: act.color }]} />
              </View>
            </View>
          );
        })}
      </Card>

      {/* Activity Timeline */}
      <Text style={styles.sectionLabel}>ACTIVITY TIMELINE</Text>
      <Card style={styles.timelineCard}>
        {deur.activities.map((event, idx) => (
          <View key={event.id} style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: getActivityColor(event.activity) }]} />
            {idx < deur.activities.length - 1 && <View style={styles.timelineLine} />}
            <View style={styles.timelineContent}>
              <Text style={styles.timelineActivity}>{event.activity}</Text>
              {event.reason && <Text style={styles.timelineReason}>{event.reason}</Text>}
              {event.category && <Text style={styles.timelineReason}>{event.category}</Text>}
              <Text style={styles.timelineTime}>
                {formatTime(event.startTime)} – {event.endTime ? formatTime(event.endTime) : 'Current'}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Quick action buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push(`/deur-meter/${deur.id}`)}
          disabled={!isActive && deur.status !== 'Ended'}
        >
          <Gauge size={20} color={colors.blue600} strokeWidth={2} />
          <Text style={styles.quickActionLabel}>Meter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push(`/deur-fuel/${deur.id}`)}
          disabled={!isActive}
        >
          <Fuel size={20} color={colors.blue600} strokeWidth={2} />
          <Text style={styles.quickActionLabel}>Fuel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push(`/deur-remarks/${deur.id}`)}
          disabled={!isActive && deur.status !== 'Ended'}
        >
          <MessageSquare size={20} color={colors.blue600} strokeWidth={2} />
          <Text style={styles.quickActionLabel}>Remarks</Text>
        </TouchableOpacity>
      </View>

      {/* Fuel entries summary */}
      {deur.fuelEntries.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>FUEL ENTRIES</Text>
          <Card style={styles.fuelCard}>
            {deur.fuelEntries.map((f) => (
              <View key={f.id} style={styles.fuelRow}>
                <Fuel size={16} color={colors.blue600} strokeWidth={2} />
                <Text style={styles.fuelQty}>{f.quantity} L</Text>
                {f.gaugeLevel && <Text style={styles.fuelGauge}>{f.gaugeLevel}</Text>}
                <Text style={styles.fuelTime}>{formatTime(f.timestamp)}</Text>
                {f.remarks ? <Text style={styles.fuelRemarks}>{f.remarks}</Text> : null}
              </View>
            ))}
          </Card>
        </>
      )}

      {/* End Shift / Turn Over / Review / Submit */}
      {isActive && (
        <>
          <TouchableOpacity
            style={styles.turnOverButton}
            onPress={() => setShowTurnOverConfirm(true)}
            activeOpacity={0.7}
          >
            <Users size={20} color={colors.blue600} strokeWidth={2} />
            <Text style={styles.turnOverText}>TURN OVER TO RELIEVER</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.endShiftButton}
            onPress={() => setShowEndConfirm(true)}
            activeOpacity={0.7}
          >
            <Square size={20} color={colors.white} strokeWidth={2} fill={colors.white} />
            <Text style={styles.endShiftText}>END SHIFT</Text>
          </TouchableOpacity>

          <ConfirmDialog
            visible={showEndConfirm}
            title="End Shift?"
            message="This will stop the current activity and end your shift. You will be taken to the DEUR summary for review."
            confirmLabel="End Shift"
            onConfirm={handleEndShift}
            onCancel={() => setShowEndConfirm(false)}
            danger
          />

          <ConfirmDialog
            visible={showTurnOverConfirm}
            title="Turn Over to Reliever?"
            message="Your segment will end and the DEUR will remain active. The reliever will log in with their PIN to continue this DEUR."
            confirmLabel="Turn Over"
            onConfirm={handleTurnOver}
            onCancel={() => setShowTurnOverConfirm(false)}
          />
        </>
      )}

      {deur.status === 'Ended' && (
        <Button
          label="REVIEW & SUBMIT DEUR"
          onPress={() => router.push(`/deur-summary/${deur.id}`)}
          style={styles.ctaButton}
        />
      )}

      {(deur.status === 'Submitted' || deur.status === 'Acknowledged') && (
        <Card style={styles.submittedCard}>
          <View style={styles.submittedRow}>
            <Text style={styles.submittedText}>
              {deur.status === 'Acknowledged' ? 'DEUR Acknowledged' : 'DEUR Submitted — Awaiting Acknowledgement'}
            </Text>
          </View>
          <Button
            label="VIEW SUMMARY"
            onPress={() => router.push(`/deur-summary/${deur.id}`)}
            variant="secondary"
          />
        </Card>
      )}

      {deur.status === 'Rejected' && (
        <Card style={styles.submittedCard}>
          <View style={styles.submittedRow}>
            <AlertTriangle size={20} color={colors.red500} strokeWidth={2} />
            <Text style={styles.submittedText}>DEUR Rejected</Text>
            {deur.rejectionReason && <Text style={styles.rejectionReason}>{deur.rejectionReason}</Text>}
          </View>
          <Button
            label="VIEW SUMMARY"
            onPress={() => router.push(`/deur-summary/${deur.id}`)}
            variant="secondary"
          />
        </Card>
      )}

      {/* Waiting Reason Modal */}
      <Modal visible={waitingModalVisible} transparent animationType="fade" onRequestClose={() => setWaitingModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Waiting Reason</Text>
            <ScrollView style={styles.reasonList}>
              {waitingReasons.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.reasonItem}
                  onPress={() => handleWaitingReasonSelect(r.label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reasonItemText}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button label="Cancel" onPress={() => setWaitingModalVisible(false)} variant="ghost" />
          </View>
        </View>
      </Modal>

      {/* Breakdown Category Modal */}
      <Modal visible={breakdownModalVisible} transparent animationType="fade" onRequestClose={() => setBreakdownModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Breakdown Category</Text>
            <ScrollView style={styles.reasonList}>
              {breakdownCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.reasonItem}
                  onPress={() => handleBreakdownCategorySelect(c.label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reasonItemText}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Optional Remarks</Text>
              <TextInput
                style={styles.modalInput}
                value={breakdownRemarks}
                onChangeText={setBreakdownRemarks}
                placeholder="Describe the issue..."
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
            <Button label="Cancel" onPress={() => setBreakdownModalVisible(false)} variant="ghost" />
          </View>
        </View>
      </Modal>
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
    paddingBottom: spacing.xxxl + 60,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slate50,
    padding: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.slate500,
  },
  header: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  screenTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.slate900,
  },
  screenSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.slate500,
  },
  infoCard: {
    gap: spacing.md,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipmentIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentInfo: {
    flex: 1,
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
    gap: spacing.md,
  },
  infoItem: {
    flexBasis: '47%',
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
  meterCard: {
    gap: 8,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meterLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.slate700,
  },
  meterValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.slate900,
  },
  startSection: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  startHint: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.slate900,
    textAlign: 'center',
  },
  startHintSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaButton: {
    width: '100%',
  },
  sectionLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.slate500,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  currentActivityCard: {
    borderWidth: 2,
    gap: 8,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  currentActivityLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    color: colors.slate500,
    letterSpacing: 1,
  },
  currentActivityName: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
  },
  currentActivityReason: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.slate700,
  },
  runningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  runningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emerald500,
  },
  runningText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.slate500,
  },
  runningDuration: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.slate900,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  activityButton: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  totalsCard: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
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
  metricDivider: {
    height: 1,
    backgroundColor: colors.slate100,
  },
  totalRow: {
    gap: 6,
  },
  totalRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRowLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate900,
  },
  totalRowValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.slate900,
  },
  totalBarBg: {
    height: 6,
    backgroundColor: colors.slate200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  totalBar: {
    height: 6,
    borderRadius: 3,
  },
  timelineCard: {
    gap: 0,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 40,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    width: 2,
    bottom: -16,
    backgroundColor: colors.slate200,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 12,
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
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
    minHeight: 64,
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate900,
  },
  fuelCard: {
    gap: 8,
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  fuelQty: {
    fontFamily: fonts.bold,
    fontSize: 13,
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
  turnOverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.blue50,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    minHeight: 56,
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.blue600,
  },
  turnOverText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.blue600,
  },
  endShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.red500,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    minHeight: 56,
    marginTop: spacing.sm,
  },
  endShiftText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  submittedCard: {
    gap: 12,
    alignItems: 'center',
  },
  submittedRow: {
    alignItems: 'center',
    gap: 4,
  },
  submittedText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.slate500,
    textAlign: 'center',
  },
  rejectionReason: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.red500,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    gap: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.slate900,
    textAlign: 'center',
  },
  reasonList: {
    maxHeight: 300,
  },
  reasonItem: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    minHeight: 52,
    justifyContent: 'center',
  },
  reasonItemText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.slate900,
  },
  modalField: {
    gap: 6,
  },
  modalFieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate700,
  },
  modalInput: {
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.slate900,
    minHeight: 60,
  },
});
