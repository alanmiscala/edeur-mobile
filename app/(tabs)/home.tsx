import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, MapPin, FileText, ChevronRight, Wifi } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/Button';
import { SyncBanner } from '@/components/SyncBanner';
import { useConnectivity } from '@/lib/useConnectivity';
import { getTotalShiftTime, getNetOperatingTime, getGrossProductiveTime, formatDurationShort, formatDate } from '@/lib/utils';

export default function HomeScreen() {
  const router = useRouter();
  const { operator } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const connectivity = useConnectivity();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  if (!operator) return null;

  const assignment = mockRepository.getOperatorAssignment(operator.id);
  const equipment = assignment ? mockRepository.getEquipment(assignment.equipmentId) : null;
  const project = assignment ? mockRepository.getProject(assignment.projectId) : null;
  const rental = mockRepository.getRentalForOperator(operator.id);
  const deur = rental ? mockRepository.getDeurForToday(operator.id, rental.id) : null;
  const history = mockRepository.getDeurHistory(operator.id).slice(0, 3);

  const totals = deur ? { net: getNetOperatingTime(deur), gross: getGrossProductiveTime(deur), total: getTotalShiftTime(deur) } : null;

  const getCtaLabel = () => {
    if (!deur) return 'START DEUR';
    if (deur.status === 'Active') return 'CONTINUE DEUR';
    if (deur.status === 'Ended') return 'REVIEW DEUR';
    if (deur.status === 'Submitted') return 'VIEW SUBMITTED';
    return 'VIEW DEUR';
  };

  const handleCta = () => {
    router.push('/(tabs)/deur');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.operatorName}>{operator.name}</Text>
        </View>
        <View style={styles.syncBadge}>
          <Wifi size={14} color={colors.emerald500} strokeWidth={2} />
          <Text style={styles.syncText}>Online</Text>
        </View>
      </View>

      <Text style={styles.dateText}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
      </Text>

      <SyncBanner status={connectivity} />

      {equipment && project && rental ? (
        <>
          <Text style={styles.sectionLabel}>CURRENT ASSIGNMENT</Text>
          <TouchableOpacity onPress={() => router.push('/assignment')} activeOpacity={0.7}>
          <Card style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <View style={styles.equipmentIcon}>
                <Truck size={20} color={colors.blue600} strokeWidth={2} />
              </View>
              <View style={styles.assignmentInfo}>
                <Text style={styles.equipmentName}>{equipment.name}</Text>
                <Text style={styles.assetNumber}>{equipment.assetNumber}</Text>
              </View>
              <StatusChip label={rental.status.toUpperCase()} variant="blue" />
            </View>
            <View style={styles.assignmentDetails}>
              <View style={styles.detailRow}>
                <MapPin size={14} color={colors.slate400} strokeWidth={2} />
                <Text style={styles.detailText}>{project.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <FileText size={14} color={colors.slate400} strokeWidth={2} />
                <Text style={styles.detailText}>{rental.rentalNumber} • {rental.billingMethod}</Text>
              </View>
            </View>
          </Card>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>TODAY&apos;S SUMMARY</Text>
          <View style={styles.totalsGrid}>
            <Card style={styles.totalCard}>
              <Text style={styles.totalValue}>{formatDurationShort(totals?.net ?? 0)}</Text>
              <Text style={[styles.totalLabel, { color: colors.emerald500 }]}>Net Op</Text>
            </Card>
            <Card style={styles.totalCard}>
              <Text style={styles.totalValue}>{formatDurationShort(totals?.gross ?? 0)}</Text>
              <Text style={[styles.totalLabel, { color: colors.amber500 }]}>Gross Prod</Text>
            </Card>
            <Card style={styles.totalCard}>
              <Text style={styles.totalValue}>{formatDurationShort(totals?.total ?? 0)}</Text>
              <Text style={[styles.totalLabel, { color: colors.blue600 }]}>Total Shift</Text>
            </Card>
          </View>

          <Text style={styles.sectionLabel}>SHIFT STATUS</Text>
          <Card style={styles.shiftCard}>
            <View style={styles.shiftRow}>
              <Text style={styles.shiftLabel}>Current DEUR</Text>
              <StatusChip
                label={deur ? deur.status.toUpperCase() : 'NOT STARTED'}
                variant={
                  !deur ? 'slate' : deur.status === 'Active' ? 'emerald' : deur.status === 'Submitted' ? 'blue' : 'amber'
                }
              />
            </View>
          </Card>

          {deur?.status !== 'Submitted' && (
            <Button
              label={getCtaLabel()}
              onPress={handleCta}
              style={styles.ctaButton}
            />
          )}
          {deur?.status === 'Submitted' && (
            <Button
              label={getCtaLabel()}
              onPress={handleCta}
              variant="secondary"
              style={styles.ctaButton}
            />
          )}

          {history.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>RECENT DEUR RECORDS</Text>
              <View style={styles.historyList}>
                {history.map((d) => {
                  const eq = mockRepository.getEquipment(d.equipmentId);
                  const rnt = mockRepository.getRental(d.rentalId);
                  return (
                    <Card key={d.id} style={styles.historyCard}>
                      <TouchableOpacity
                        style={styles.historyItem}
                        onPress={() => router.push(`/deur-details/${d.id}`)}
                      >
                        <View style={styles.historyLeft}>
                          <Text style={styles.historyDate}>{formatDate(d.date)}</Text>
                          <Text style={styles.historyEquipment}>{eq?.name ?? 'Unknown'}</Text>
                          <Text style={styles.historyRental}>{rnt?.rentalNumber ?? '---'}</Text>
                        </View>
                        <View style={styles.historyRight}>
                          <StatusChip
                            label={d.status.toUpperCase()}
                            variant={
                              d.status === 'Submitted' || d.status === 'Acknowledged'
                                ? 'blue'
                                : d.status === 'Rejected'
                                  ? 'red'
                                  : 'amber'
                            }
                          />
                          <ChevronRight size={18} color={colors.slate300} strokeWidth={2} />
                        </View>
                      </TouchableOpacity>
                    </Card>
                  );
                })}
              </View>
            </>
          )}
        </>
      ) : (
        <Card style={styles.noAssignment}>
          <Text style={styles.noAssignmentText}>No active assignment found.</Text>
          <Text style={styles.noAssignmentSub}>Contact your supervisor to get assigned to equipment.</Text>
        </Card>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.slate500,
  },
  operatorName: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.slate900,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.emerald50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  syncText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.emerald500,
  },
  dateText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.slate500,
    marginTop: -4,
  },
  sectionLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.slate500,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  assignmentCard: {
    gap: spacing.md,
  },
  assignmentHeader: {
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
  assignmentInfo: {
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
  assignmentDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate700,
  },
  totalsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  totalCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: spacing.md,
  },
  totalValue: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.slate900,
  },
  totalLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  shiftCard: {
    gap: 8,
  },
  shiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.slate900,
  },
  ctaButton: {
    marginTop: spacing.sm,
  },
  historyList: {
    gap: spacing.md,
  },
  historyCard: {
    padding: 0,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  historyLeft: {
    gap: 2,
  },
  historyDate: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.slate900,
  },
  historyEquipment: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate700,
  },
  historyRental: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.slate500,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noAssignment: {
    alignItems: 'center',
    gap: 8,
    padding: spacing.xxl,
  },
  noAssignmentText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.slate900,
  },
  noAssignmentSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate500,
    textAlign: 'center',
  },
});
