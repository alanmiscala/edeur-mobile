import { StyleSheet, Text, View } from 'react-native';
import { Wifi, WifiOff, RefreshCw, CheckCircle, CloudOff, AlertCircle } from 'lucide-react-native';
import { colors, fonts, radius } from '@/lib/theme';
import type { ConnectionStatus } from '@/lib/useConnectivity';

export function SyncBanner({ status }: { status: ConnectionStatus }) {
  if (status === 'online') return null;

  const config = {
    offline: {
      bg: colors.amber50,
      text: colors.amber500,
      icon: <WifiOff size={14} color={colors.amber500} strokeWidth={2} />,
      label: 'You are offline. Data is saved locally and will sync when connection returns.',
    },
    syncing: {
      bg: colors.blue50,
      text: colors.blue600,
      icon: <RefreshCw size={14} color={colors.blue600} strokeWidth={2} />,
      label: 'Syncing your data...',
    },
    pending: {
      bg: colors.amber50,
      text: colors.amber500,
      icon: <CloudOff size={14} color={colors.amber500} strokeWidth={2} />,
      label: 'Changes pending sync. Will upload when online.',
    },
    synced: {
      bg: colors.emerald50,
      text: colors.emerald500,
      icon: <CheckCircle size={14} color={colors.emerald500} strokeWidth={2} />,
      label: 'All data synced.',
    },
    failed: {
      bg: colors.red50,
      text: colors.red500,
      icon: <AlertCircle size={14} color={colors.red500} strokeWidth={2} />,
      label: 'Sync failed. Will retry automatically.',
    },
  }[status];

  return (
    <View style={[styles.banner, { backgroundColor: config.bg }]}>
      {config.icon}
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});
