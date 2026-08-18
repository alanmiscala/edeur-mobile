import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ChevronRight } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { StatusChip } from '@/components/StatusChip';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, formatDurationShort, getTotalShiftTime, getNetOperatingTime } from '@/lib/utils';
import { TouchableOpacity } from 'react-native';

export default function HistoryScreen() {
  const router = useRouter();
  const { operator } = useAuth();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  if (!operator) return null;

  const allHistory = mockRepository.getDeurHistory(operator.id);
  const filtered = search.trim()
    ? allHistory.filter((d) => {
        const eq = mockRepository.getEquipment(d.equipmentId);
        const rnt = mockRepository.getRental(d.rentalId);
        const s = search.toLowerCase();
        return (
          eq?.name.toLowerCase().includes(s) ||
          rnt?.rentalNumber.toLowerCase().includes(s) ||
          d.date.includes(s)
        );
      })
    : allHistory;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.screenTitle}>DEUR History</Text>
      <Text style={styles.screenSubtitle}>Your submitted and past reports</Text>

      <View style={styles.searchContainer}>
        <Search size={18} color={colors.slate400} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date, equipment, or rental"
          placeholderTextColor={colors.slate400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "No matching records" : "No DEUR records yet"}
          message={search ? "Try a different search term." : "Your submitted DEUR reports will appear here."}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((d) => {
            const eq = mockRepository.getEquipment(d.equipmentId);
            const rnt = mockRepository.getRental(d.rentalId);
            const netOp = getNetOperatingTime(d);
            const totalMs = getTotalShiftTime(d);
            return (
              <Card key={d.id} style={styles.historyCard}>
                <TouchableOpacity
                  style={styles.cardContent}
                  onPress={() => router.push(`/deur-details/${d.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.dateText}>{formatDate(d.date)}</Text>
                    <StatusChip
                      label={d.status.toUpperCase()}
                      variant={
                        d.status === 'Submitted' || d.status === 'Acknowledged'
                          ? 'blue'
                          : d.status === 'Rejected'
                            ? 'red'
                            : d.status === 'Active'
                              ? 'emerald'
                              : 'amber'
                      }
                    />
                  </View>
                  <Text style={styles.equipmentName}>{eq?.name ?? 'Unknown'}</Text>
                  <View style={styles.cardDetails}>
                    <Text style={styles.detailText}>{rnt?.rentalNumber ?? '---'}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.detailText}>{formatDurationShort(netOp)} operating</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.detailText}>{formatDurationShort(totalMs)} total</Text>
                    {d.operatorSegments.length > 1 && (
                      <>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.detailText}>{d.operatorSegments.length} operators</Text>
                      </>
                    )}
                  </View>
                  <ChevronRight size={18} color={colors.slate300} strokeWidth={2} style={styles.chevron} />
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>
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
  screenTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.slate900,
  },
  screenSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.slate500,
    marginTop: -4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.slate900,
    minHeight: 24,
  },
  list: {
    gap: spacing.md,
  },
  historyCard: {
    padding: 0,
  },
  cardContent: {
    padding: 16,
    position: 'relative',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.slate900,
  },
  equipmentName: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate700,
    marginBottom: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  detailText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
  },
  dot: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate300,
  },
  chevron: {
    position: 'absolute',
    right: 12,
    top: '50%',
  },
});
