import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/useTheme';
import { radius, spacing } from '@/lib/theme';
import { Button } from './Button';

interface ConfirmDialogProps {
  visible: boolean; title: string; message: string;
  confirmLabel?: string; cancelLabel?: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger }: ConfirmDialogProps) {
  const { colors: c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: c.surface }]}>
          <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: c.textMuted }]}>{message}</Text>
          <View style={styles.actions}>
            <Button label={cancelLabel} onPress={onCancel} variant="ghost" style={styles.button} />
            <Button label={confirmLabel} onPress={onConfirm} variant={danger ? 'danger' : 'primary'} style={styles.button} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: { borderRadius: radius.xxl, padding: spacing.xl, width: '100%', maxWidth: 340, gap: spacing.md, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  title: { fontFamily: 'Manrope-ExtraBold', fontSize: 18, textAlign: 'center' },
  message: { fontFamily: 'Manrope-Regular', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.md, width: '100%', marginTop: spacing.sm },
  button: { flex: 1 },
});
