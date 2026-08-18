import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Truck, MapPin, FileText, Info } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { mockRepository } from '@/lib/mockRepository';
import { Card } from '@/components/Card';
import { StatusChip } from '@/components/StatusChip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useState } from 'react';

export default function ProfileScreen() {
  const router = useRouter();
  const { operator, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  if (!operator) return null;

  const assignment = mockRepository.getOperatorAssignment(operator.id);
  const equipment = assignment ? mockRepository.getEquipment(assignment.equipmentId) : null;
  const project = assignment ? mockRepository.getProject(assignment.projectId) : null;
  const rental = mockRepository.getRentalForOperator(operator.id);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{operator.initials}</Text>
        </View>
        <Text style={styles.operatorName}>{operator.name}</Text>
        <Text style={styles.operatorId}>Operator ID: {operator.id.toUpperCase()}</Text>
      </View>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Login Name</Text>
          <Text style={styles.rowValue}>{operator.loginName}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Role</Text>
          <Text style={styles.rowValue}>Equipment Operator</Text>
        </View>
      </Card>

      <Text style={styles.sectionLabel}>CURRENT ASSIGNMENT</Text>
      <Card style={styles.card}>
        {equipment ? (
          <>
            <View style={styles.assignmentRow}>
              <Truck size={18} color={colors.blue600} strokeWidth={2} />
              <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentLabel}>Equipment</Text>
                <Text style={styles.assignmentValue}>{equipment.name}</Text>
                <Text style={styles.assignmentSub}>{equipment.assetNumber}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.assignmentRow}>
              <MapPin size={18} color={colors.blue600} strokeWidth={2} />
              <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentLabel}>Project</Text>
                <Text style={styles.assignmentValue}>{project?.name ?? '---'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.assignmentRow}>
              <FileText size={18} color={colors.blue600} strokeWidth={2} />
              <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentLabel}>Rental</Text>
                <Text style={styles.assignmentValue}>{rental?.rentalNumber ?? '---'}</Text>
                <StatusChip label={rental?.status.toUpperCase() ?? '---'} variant="blue" style={styles.rentalStatus} />
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.noAssignment}>No active assignment</Text>
        )}
      </Card>

      <Text style={styles.sectionLabel}>APPLICATION</Text>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Info size={16} color={colors.slate400} strokeWidth={2} />
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Session</Text>
          <Text style={styles.rowValue}>Active</Text>
        </View>
      </Card>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setShowLogout(true)}
        activeOpacity={0.7}
      >
        <LogOut size={20} color={colors.red500} strokeWidth={2} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={showLogout}
        title="Logout?"
        message="You will be returned to the login screen. Any unsaved DEUR data will remain in the app."
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
        danger
      />
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
  profileHeader: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.white,
  },
  operatorName: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.slate900,
  },
  operatorId: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.slate500,
  },
  sectionLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.slate500,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  card: {
    gap: 0,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.slate500,
  },
  rowValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.slate900,
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate100,
    marginLeft: 16,
  },
  assignmentRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  assignmentInfo: {
    flex: 1,
    gap: 2,
  },
  assignmentLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
  },
  assignmentValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.slate900,
  },
  assignmentSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.slate500,
  },
  rentalStatus: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  noAssignment: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.slate500,
    padding: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.red50,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    minHeight: 52,
    marginTop: spacing.sm,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.red500,
  },
});
