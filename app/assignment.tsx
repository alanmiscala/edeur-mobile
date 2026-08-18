import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Truck, MapPin, FileText, User, Calendar, Gauge } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
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
  if (!operator) return null;

  const assignment = mockRepository.getOperatorAssignment(operator.id);
  const equipment = assignment ? mockRepository.getEquipment(assignment.equipmentId) : null;
  const project = assignment ? mockRepository.getProject(assignment.projectId) : null;
  const rental = mockRepository.getRentalForOperator(operator.id);

  if (!equipment || !assignment || !project || !rental) {
    return (
      <View style={styles.container}>
        <PageHeader title="My Equipment" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active assignment found.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <PageHeader title="My Equipment" onBack={() => router.back()} />
      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.equipmentRow}>
            <View style={styles.equipmentIcon}>
              <Truck size={24} color={colors.blue600} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.equipmentName}>{equipment.name}</Text>
              <Text style={styles.assetNumber}>{equipment.assetNumber}</Text>
            </View>
            <StatusChip label={equipment.status.toUpperCase()} variant="blue" />
          </View>
        </Card>

        <Text style={styles.sectionLabel}>EQUIPMENT DETAILS</Text>
        <Card style={styles.card}>
          <DetailRow icon={<Gauge size={16} color={colors.slate400} strokeWidth={2} />} label="Category" value={equipment.category} />
          <Divider />
          <DetailRow icon={<FileText size={16} color={colors.slate400} strokeWidth={2} />} label="Status" value={equipment.status} />
          <Divider />
          <DetailRow icon={<Gauge size={16} color={colors.slate400} strokeWidth={2} />} label="Hour Meter" value={`${equipment.hourMeter.toLocaleString()} h`} />
        </Card>

        <Text style={styles.sectionLabel}>ASSIGNMENT</Text>
        <Card style={styles.card}>
          <DetailRow icon={<User size={16} color={colors.slate400} strokeWidth={2} />} label="Operator" value={operator.name} />
          <Divider />
          <DetailRow icon={<MapPin size={16} color={colors.slate400} strokeWidth={2} />} label="Project" value={project.name} />
          <Divider />
          <DetailRow icon={<Calendar size={16} color={colors.slate400} strokeWidth={2} />} label="Assigned Date" value={formatDate(assignment.assignedDate)} />
          <Divider />
          <DetailRow icon={<FileText size={16} color={colors.slate400} strokeWidth={2} />} label="Assignment Status" value={assignment.status} />
        </Card>

        <Text style={styles.sectionLabel}>RENTAL</Text>
        <Card style={styles.card}>
          <View style={styles.rentalHeader}>
            <View>
              <Text style={styles.rentalNumber}>{rental.rentalNumber}</Text>
              <Text style={styles.rentalCustomer}>{rental.customerName}</Text>
            </View>
            <StatusChip label={rental.status.toUpperCase()} variant="blue" />
          </View>
          <Divider />
          <DetailRow icon={<Calendar size={16} color={colors.slate400} strokeWidth={2} />} label="Start Date" value={formatDate(rental.startDate)} />
          <Divider />
          <DetailRow icon={<Calendar size={16} color={colors.slate400} strokeWidth={2} />} label="End Date" value={formatDate(rental.endDate)} />
          <Divider />
          <DetailRow icon={<FileText size={16} color={colors.slate400} strokeWidth={2} />} label="Billing Method" value={rental.billingMethod} />
        </Card>
      </View>
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      {icon}
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.slate900,
  },
  assetNumber: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate500,
  },
  sectionLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.slate500,
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
    color: colors.slate500,
  },
  detailValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.slate900,
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate100,
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
    color: colors.blue600,
  },
  rentalCustomer: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate500,
    marginTop: 2,
  },
});
