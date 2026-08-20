import { StyleSheet, Text, View } from 'react-native';
import { Wifi, WifiOff, RefreshCw, CheckCircle, CloudOff, AlertCircle } from 'lucide-react-native';
import { fonts, radius } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { ConnectionStatus } from '@/lib/useConnectivity';

export function SyncBanner({ status }: { status: ConnectionStatus }) {
  const { colors: c } = useTheme();

  if (status === 'online') return null;

  const config = {
    offline: {
      bg: c.amber50,
      text: c.amber500,
      icon: <WifiOff size={14} color={c.amber500} strokeWidth={2} />,
      label: 'You are offline. Data is saved locally and will sync when connection returns.',
    },
    syncing: {
      bg: c.blue50,
      text: c.blue600,
      icon: <RefreshCw size={14} color={c.blue600} strokeWidth={2} />,
      label: 'Syncing your data...',
    },
    pending: {
      bg: c.amber50,
      text: c.amber500,
      icon: <CloudOff size={14} color={c.amber500} strokeWidth={2} />,
      label: 'Changes pending sync. Will upload when online.',
    },
    synced: {
      bg: c.emerald50,
      text: c.emerald500,
      icon: <CheckCircle size={14} color={c.emerald500} strokeWidth={2} />,
      label: 'All data synced.',
    },
    failed: {
      bg: c.red50,
      text: c.red500,
      icon: <AlertCircle size={14} color={c.red500} strokeWidth={2} />,
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
