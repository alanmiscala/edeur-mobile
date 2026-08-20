import { StyleSheet } from 'react-native';
import { Image } from 'react-native';
import { useTheme } from '@/lib/useTheme';

interface PscLogoProps { size?: number; }

export function PscLogo({ size = 48 }: PscLogoProps) {
  const { mode } = useTheme();
  return (
    <Image
      source={require('@/assets/images/icon.png')}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="contain"
      tintColor={undefined}
      accessible
      accessibilityLabel="PSC Equipment Department logo"
    />
  );
}

const styles = StyleSheet.create({});
