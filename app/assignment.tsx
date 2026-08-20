import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Truck, MapPin, FileText, User, Calendar, Gauge } from 'lucide-react-native';
import { fonts, radius, spacing } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { ThemeColors } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { StatusChip } from '@/components/StatusChip';
import { PageHeader } from '@/components/PageHeader';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'expo-router';

export default function AssignmentScreen() {
  const router = useRouter();
  const { operator } = useAuth();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  if (!operator) return null;

  const activeDeur = mockRepository.getActiveDeurForOperator(operator.id);
  const assignment = mockRepository.getOperatorAssignment(operator.id) ?? (activeDeur ? mockRepository.getAssignmentForDeur(activeDeur.id) : null);
  const equipment = assignment ? mockRepository.getEquipment(assignment.equipmentId) : null;
  const project = assignment ? mockRepository.getProject(assignment.projectId) : null;
  const rental = mockRepository.getRentalForOperator(operator.id) ?? (activeDeur ? mockRepository.getRentalForDeur(activeDeur.id) : null);

  if (!equipment || !assignment || !project || !rental) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <PageHeader title="My Equipment" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>No active assignment found.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <PageHeader title="My Equipment" onBack={() => router.back()} />
      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.equipmentRow}>
            <View style={[styles.equipmentIcon, { backgroundColor: c.blue50 }]}>
              <Truck size={24} color={c.blue600} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.equipmentName, { color: c.textPrimary }]}>{equipment.name}</Text>
              <Text style={[styles.assetNumber, { color: c.textMuted }]}>{equipment.assetNumber}</Text>
            </View>
            <StatusChip label={equipment.status.toUpperCase()} variant="blue" />
          </View>
        </Card>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>EQUIPMENT DETAILS</Text>
        <Card style={styles.card}>
          <DetailRow icon={<Gauge size={16} color={c.textMuted} strokeWidth={2} />} label="Category" value={equipment.category} c={c} />
          <Divider c={c} />
          <DetailRow icon={<FileText size={16} color={c.textMuted} strokeWidth={2} />} label="Status" value={equipment.status} c={c} />
          <Divider c={c} />
          <DetailRow icon={<Gauge size={16} color={c.textMuted} strokeWidth={2} />} label="Hour Meter" value={`${equipment.hourMeter.toLocaleString()} h`} c={c} />
        </Card>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ASSIGNMENT</Text>
        <Card style={styles.card}>
          <DetailRow icon={<User size={16} color={c.textMuted} strokeWidth={2} />} label="Operator" value={operator.name} c={c} />
          <Divider c={c} />
          <DetailRow icon={<MapPin size={16} color={c.textMuted} strokeWidth={2} />} label="Project" value={project.name} c={c} />
          <Divider c={c} />
          <DetailRow icon={<Calendar size={16} color={c.textMuted} strokeWidth={2} />} label="Assigned Date" value={formatDate(assignment.assignedDate)} c={c} />
          <Divider c={c} />
          <DetailRow icon={<FileText size={16} color={c.textMuted} strokeWidth={2} />} label="Assignment Status" value={assignment.status} c={c} />
        </Card>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>RENTAL</Text>
        <Card style={styles.card}>
          <View style={styles.rentalHeader}>
            <View>
              <Text style={[styles.rentalNumber, { color: c.blue600 }]}>{rental.rentalNumber}</Text>
              <Text style={[styles.rentalCustomer, { color: c.textMuted }]}>{rental.customerName}</Text>
            </View>
            <StatusChip label={rental.status.toUpperCase()} variant="blue" />
          </View>
          <Divider c={c} />
          <DetailRow icon={<Calendar size={16} color={c.textMuted} strokeWidth={2} />} label="Start Date" value={formatDate(rental.startDate)} c={c} />
          <Divider c={c} />
          <DetailRow icon={<Calendar size={16} color={c.textMuted} strokeWidth={2} />} label="End Date" value={formatDate(rental.endDate)} c={c} />
          <Divider c={c} />
          <DetailRow icon={<FileText size={16} color={c.textMuted} strokeWidth={2} />} label="Billing Method" value={rental.billingMethod} c={c} />
        </Card>
      </View>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, c }: { icon: React.ReactNode; label: string; value: string; c: ThemeColors }) {
  return (
    <View style={styles.detailRow}>
      {icon}
      <Text style={[styles.detailLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: c.textPrimary }]}>{value}</Text>
    </View>
  );
}

function Divider({ c }: { c: ThemeColors }) {
  return <View style={[styles.divider, { backgroundColor: c.slate100 }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  card: {
    gap: 0,
    padding: 0,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipmentIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentName: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  assetNumber: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  sectionLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  detailLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  detailValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  rentalNumber: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
  },
  rentalCustomer: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
});
